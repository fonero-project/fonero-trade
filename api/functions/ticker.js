const Promise = require('bluebird');
const _ = require('lodash');
const rp = require('request-promise');
const FoneroSdk = require('fonero-sdk');
const niceRound = require('./utils/niceRound');
const tradeWalker = require('./utils/tradeWalker');

const PQueue = require('p-queue');
const queue = new PQueue({concurrency: 20});
const run = queue.add;

const directory = require('../directory.json');

Server = new FoneroSdk.Server('https://horizon.trade.fonero.org');
FoneroSdk.Network.usePublicNetwork();

function medianOf3(a,b,c) {
  return [a,b,c].sort()[1];
}

function tickerGenerator() {
  let finish;
  let ticker = {
    _meta: {
      start: Math.floor(Date.now()/1000),
      startISO: Date(),
      apiLicense: 'Apache-2.0',
    },
  };

  let tickerPromise = Promise.resolve()
    .then(() => phase1(ticker))
    .then(() => loadAssets(ticker))
    .then(() => phase3(ticker))
    .then(() => phase4(ticker))
    .then(() => {
      return {
        'v1/ticker.json': JSON.stringify(ticker)
      };
    })

  return tickerPromise;
}

function phase1(ticker) {
  return Promise.all([
    getHorizonMain()
      .then(main => {
        ticker._meta.horizon = {
          core_latest_ledger: main.core_latest_ledger,
          network_passphrase: main.network_passphrase,
        }
      })
    ,
    getFoneroTermDotComVersion()
      .then(version => {
        ticker._meta.foneroTermVersion = version;
      })
    ,
    getExternalPrices()
      .then(externalPrices => {
        console.log('Phase 1: Finished external prices')
        console.log(JSON.stringify(externalPrices, null, 2));
        ticker._meta.externalPrices = externalPrices;

        // Just incase CMC is down
        ticker._meta.externalPrices.USD_FNO_24hAgo = ticker._meta.externalPrices.USD_FNO;
      })
      .then(() => {
        return rp('https://api.coinmarketcap.com/v1/ticker/fonero/')
          .then(cmcTickerJson => {
            let cmcFonero = JSON.parse(cmcTickerJson)[0];
            let newPriceRatio = 1 + Number(cmcFonero.percent_change_24h)/100;
            let oldPrice = (1/newPriceRatio) * ticker._meta.externalPrices.USD_FNO;
            ticker._meta.externalPrices.USD_FNO_24hAgo = _.round(oldPrice,6);
            ticker._meta.externalPrices.USD_FNO_change = _.round(cmcFonero.percent_change_24h,6);
          })
      })
  ])
}

function loadAssets(ticker) {
  ticker.assets = [];

  ticker.assets.push({
    id: 'FNO-native',
    code: 'FNO',
    issuer: null,
    domain: 'native',
    slug: 'FNO-native',
    website: 'https://www.fonero.org',
    price_FNO: 1, // LOL 1 dogecoin = 1 dogecoin; 1 fonero = 1 fonero
    price_USD: ticker._meta.externalPrices.USD_FNO,
  })
  _.each(directory.assets, (asset, id) => {
    let r = {};
    r.id = id;
    r.code = asset.code;
    r.issuer = asset.issuer;
    r.domain = asset.domain;
    r.slug = asset.code + '-' + asset.domain;
    r.website = directory.anchors[asset.domain].website;
    ticker.assets.push(r)
  });
}

function phase3(ticker) {
  ticker.pairs = {};
  _.each(directory.pairs, (pairData, id) => {
    ticker.pairs[id] = {
      baseBuying: pairData.baseBuying,
      counterSelling: pairData.counterSelling,
    };
  });

  let foneroVolumeFNO = 0;
  let foneroVolumeUSD = 0;

  return Promise.all(_.map(ticker.pairs, (pair, pairSlug) => {
    let baseBuying     = new FoneroSdk.Asset(pair.baseBuying.code, pair.baseBuying.issuer);
    let counterSelling = new FoneroSdk.Asset(pair.counterSelling.code, pair.counterSelling.issuer);

    let asset;
    if (baseBuying.isNative()) {
      asset = _.find(ticker.assets, {
        code: pair.counterSelling.code,
        issuer: pair.counterSelling.issuer,
      });
      asset.topTradePairSlug = pairSlug;
    } else if (counterSelling.isNative()) {
      asset = _.find(ticker.assets, {
        code: pair.baseBuying.code,
        issuer: pair.baseBuying.issuer,
      });
      asset.topTradePairSlug = pairSlug;
    }

    return Server.orderbook(baseBuying, counterSelling).call()
      .then((res) => {
        if (res.bids.length === 0 || res.asks.length === 0) {
          return;
        }
        pair.bid = _.round(res.bids[0].price, 7);
        pair.ask = _.round(res.asks[0].price, 7);
        pair.spread = _.round(1 - pair.bid/pair.ask, 4);
        pair.price = _.round((parseFloat(pair.bid) + parseFloat(pair.ask))/2, 7);

        if (pair.spread > 0.4 && counterSelling.isNative()) {
          pair.price = pair.bid;
        }

        // Depth of the market of both sides
        let sum10PercentBidAmounts = _.sumBy(res.bids, bid => {
          if (parseFloat(bid.price)/pair.price >= 0.9) {
            return parseFloat(bid.amount);
          }
          return 0;
        });
        let sum10PercentAskAmounts = _.sumBy(res.asks, ask => {
          if (parseFloat(ask.price)/pair.price <= 1.1) {
            return parseFloat(ask.amount);
          }
          return 0;
        });


        // We get the min so that it can't be gamed by the issuer making a large sell wall
        pair.depth10Amount = _.round(Math.min(sum10PercentBidAmounts, sum10PercentAskAmounts));
        return Server.tradeAggregation(baseBuying, counterSelling, Date.now() - 86400*1000, Date.now(), 900000).limit(200).order('desc').call()
        .then(trades => {
          const FNOOldPrice = ticker._meta.externalPrices.USD_FNO_24hAgo;
          const FNONewPrice = ticker._meta.externalPrices.USD_FNO;

          if (baseBuying.isNative()) {
            asset.change24h_FNO = null;
            asset.change24h_USD = null;

            if (trades.records.length > 6) {
              let openFNO = 1/medianOf3(Number(trades.records[trades.records.length - 1].close), Number(trades.records[trades.records.length - 2].close), Number(trades.records[trades.records.length - 3].close));
              let closeFNO = 1/pair.price;

              let openUSD = openFNO * FNOOldPrice;
              let closeUSD = closeFNO * FNONewPrice;
              asset.change24h_FNO = _.round(100*(closeFNO/openFNO - 1), 2);
              asset.change24h_USD = _.round(100*(closeUSD/openUSD - 1), 2);
            }

            asset.price_FNO = niceRound(1/pair.price);
            asset.price_USD = niceRound(1/pair.price * ticker._meta.externalPrices.USD_FNO);

            pair.volume24h_FNO = niceRound(_.sumBy(trades.records, record => Number(record.base_volume)));
          } else if (counterSelling.isNative()) {
            asset.change24h_FNO = null;
            asset.change24h_USD = null;

            asset.price_FNO = niceRound(pair.price);
            asset.price_USD = niceRound(pair.price * ticker._meta.externalPrices.USD_FNO);

            if (trades.records.length > 6) {
              let openFNO = medianOf3(Number(trades.records[trades.records.length - 1].close), Number(trades.records[trades.records.length - 2].close), Number(trades.records[trades.records.length - 3].close));
              let closeFNO = pair.price;

              let openUSD = openFNO * FNOOldPrice;
              let closeUSD = closeFNO * FNONewPrice;
              asset.change24h_FNO = _.round(100*(closeFNO/openFNO - 1), 2);
              asset.change24h_USD = _.round(100*(closeUSD/openUSD - 1), 2);
            }
            pair.volume24h_FNO = niceRound(_.sumBy(trades.records, record => Number(record.counter_volume)));
          } else {
            // TODO: Add num trades for other trade pairs too
            console.error();
            console.error('Error: No support in Fonero Trade ticker for pairs without FNO. ' + pairSlug);
            console.error();
            return;
          }

          pair.numTrades24h = _.sumBy(trades.records, record => record.trade_count);
          asset.numTrades24h = pair.numTrades24h;
          asset._numTradeRecords24h = trades.records.length;

          console.log('Phase 3: ', _.padEnd(pairSlug, 40), _.padStart(pair.numTrades24h + ' trades', 12), _.padStart(asset.price_FNO + ' FNO', 14), _.padStart('$' + asset.price_USD.toFixed(2), 9), 'Change FNO : ' + _.padStart(asset.change24h_FNO,6) + '%','Change USD : ' + _.padStart(asset.change24h_USD,6) + '%', _.padStart(trades.records.length, 4) + ' records')

          asset.volume24h_FNO = pair.volume24h_FNO;
          asset.volume24h_USD = niceRound(pair.volume24h_FNO * ticker._meta.externalPrices.USD_FNO);

          asset.spread = pair.spread;
          foneroVolumeFNO += pair.volume24h_FNO;
          foneroVolumeUSD += asset.volume24h_USD;
          asset.topTradePairSlug = pairSlug;

          asset.numBids = res.bids.length;
          asset.numAsks = res.asks.length;

          asset.depth10_FNO = niceRound(pair.depth10Amount);
          asset.depth10_USD = niceRound(asset.depth10_FNO*ticker._meta.externalPrices.USD_FNO);
        })
      })
  }))
  .then(() => {
    ticker.assets[0].volume24h_FNO = niceRound(foneroVolumeFNO);
    ticker.assets[0].volume24h_USD = niceRound(foneroVolumeUSD);
  });
}

function phase4(ticker) {
  // Assign a score to each asset
  _.each(ticker.assets, asset => {
    if (asset.id === 'FNO-native') {
      asset.activityScore = 100;
      return;
    }
    // Has orderbook info relating to FNO
    if (asset.price_FNO === undefined) {
      asset.activityScore = 0;
      return;
    }
    let directoryAsset = directory.assets[asset.id];

    // Having the full amount of 20 bids and asks on each side is important since
    // it makes the market look like there is activity
    // It's a flat improvement so that even those without market makers can improve their ranking
    let numOffersScore = (asset.numBids + asset.numAsks)/20; // [0,2]

    // A bonus for having an average of up to 12 trade every 24 hours. Adds
    // more detail to the charts. However, we don't want to overemphasize taking
    // This is again to help assets with little activity
    let constantActivityBonus = Math.min(12, asset._numTradeRecords24h)/24; // [0,0.5]

    // It's nice to at least show that there is something happening.
    // Just $100 volume gets the asset a nice bonus
    let nonzeroVolumeBonus = Math.min(1, asset.volume24h_USD/100); // [0,1]

    // IOUs represent an inherent risk to the user
    // Whereas tokens are already "useless"
    let tokenBonus = directoryAsset.type === 'token' ? 5 : 0;

    let bonuses = numOffersScore + constantActivityBonus + nonzeroVolumeBonus + tokenBonus;

    // For assets to do well, they don't need to have all the metrics so that
    // assets that dont do well in one category won't get punished.

    // Having good depth is SUPER important
    // Use a lower base log to make it easier to get depth points
    let depth10Score = 0.5 * (Math.log(2 + asset.depth10_USD)/Math.log(2) - 1); // [0, infinity]

    // Lets also add a linear component to depth score.
    // Again, we are emphasizing depth. Cap it at $100k.
    // $50k depth should cover the bases of small users.
    depth10Score += Math.min(10, asset.depth10_USD/10000); // += [0, 10]

    // Volume really helps! However, it's not as important as depth especially
    // since there are no pecentage fees on the Fonero network
    let volumeScore = Math.log(4 + asset.volume24h_USD)/Math.log(4) - 1; // [0, infinity]

    // numTrades is helpful too. Especially the first few num trades are important!
    // But we want to encourage depth more than market taking
    let numTradesScore = Math.log(4 + asset.numTrades24h)/Math.log(4) - 1; // log4(numTrades24h)

    // But numTrades doesn't really give us a picture of how active it is.
    // We want to look even more at how much percentage of the day there is activity
    // Constant activity is best
    numTradesScore += Math.min(7, asset._numTradeRecords24h / 8); // += [0,7]

    // We want the score to be slightly more stable, so just a little spread can negatively influence
    // It's also a easy fix for issuers. With a big spread, the other stuff is kinda useless
    // Helps distinguish between assets that only have offers and nothing much else
    let spreadPenalty = Math.pow((1-asset.spread), 3); // range: [0,1]

    asset.activityScore = spreadPenalty * (bonuses + depth10Score + volumeScore + numTradesScore);
    console.log('Phase 4: ', _.padEnd(asset.slug, 25), 'Score:', _.padStart(_.round(asset.activityScore, 3), 6), ' Inputs:', spreadPenalty.toFixed(3) + ' * (',
      _.padStart(bonuses.toFixed(3), 6), '+',
      _.padStart(depth10Score.toFixed(3), 6), '+',
      _.padStart(volumeScore.toFixed(3), 6), '+',
      _.padStart(numTradesScore.toFixed(3), 6), '+',
      ')'
    );
  });

  console.log('Phase 4 explanation: spreadPenalty * (bonuses + depth10Score + volumeScore + numTradesScore)');

  ticker.assets.sort((a,b) => {
    return b.activityScore - a.activityScore;
  });

  _.each(ticker.assets, asset => {
    asset.activityScore = _.round(asset.activityScore, 3);
  })
}

function getExternalPrices() {
  return Promise.all([
    getBtcPrice(),
    getFoneroPrice(),
  ])
  .then(externalData => {
    return {
      USD_BTC: externalData[0],
      BTC_FNO: externalData[1],
      USD_FNO: _.round(externalData[0]*externalData[1],6),
    }
  })
}

function getBtcPrice() {
  return Promise.all([
    rp('https://api.coindesk.com/v1/bpi/currentprice.json')
      .then(data => {
        let price = _.round(JSON.parse(data).bpi.USD.rate_float, 3);
        console.log('Phase 1: Coindesk BTC price ', price)
        return price;
      })
      .catch(() => {
        return null;
      })
    ,
    rp('https://api.bitfinex.com/v2/ticker/tBTCUSD')
      .then(data => {
        let price = _.round(JSON.parse(data)[2], 3);
        console.log('Phase 1: Bitfinex BTC price ', price)
        return price;
      })
      .catch(() => {
        return null;
      })
    ,
    rp('https://api.coinbase.com/v2/prices/spot?currency=USD')
      .then(data => {
        let price = _.round(JSON.parse(data).data.amount, 3);
        console.log('Phase 1: Coinbase BTC price ', price)
        return price;
      })
      .catch(() => {
        return null;
      })
    ,
    rp('https://api.kraken.com/0/public/Ticker?pair=XBTUSD')
      .then(data => {
        let price = _.round(JSON.parse(data).result.XXBTZUSD.c[0], 3);
        console.log('Phase 1: Kraken   BTC price ', price)
        return price;
      })
      .catch(() => {
        return null;
      })
  ])
  .then(allPrices => {
    let btcPrice = _.round(_.mean(_.filter(allPrices, price => price !== null)), 2);
    console.log('Phase 1: BTC price = $' + btcPrice);
    return btcPrice;
  })
}

// Get fonero price in terms of btc
function getFoneroPrice() {
  return Promise.all([
    rp('https://poloniex.com/public?command=returnTicker')
      .then(data => {
        return parseFloat(JSON.parse(data).BTC_STR.last);
      })
      .catch(() => {
        return null;
      })
    ,
    rp('https://bittrex.com/api/v1.1/public/getticker?market=BTC-FNO')
      .then(data => {
        return parseFloat(JSON.parse(data).result.Last);
      })
      .catch(() => {
        return null;
      })
    ,
    rp('https://api.kraken.com/0/public/Ticker?pair=FNOXBT')
      .then(data => {
        return parseFloat(JSON.parse(data).result.XFNOXXBT.c[0]);
      })
      .catch(() => {
        return null;
      })
  ])
  .then(allPrices => {
    let fnoPrice = _.round(_.mean(_.filter(allPrices, price => price !== null)), 8);
    console.log('Phase 1: FNO price ' + fnoPrice + ' FNO/BTC');
    return fnoPrice;
  })
}

function getHorizonMain() {
  return rp('https://horizon.trade.fonero.org/')
    .then(horizonMainJson => {
      let horizonMain = JSON.parse(horizonMainJson);
      console.log('Phase 1: Horizon at ledger #' + horizonMain.core_latest_ledger);
      return horizonMain;
    })
}

function getFoneroTermDotComVersion() {
  console.log('Phase 1: Fetching trade.fonero.org')
  return rp('https://trade.fonero.org/')
    .then(indexHtml => {
      let search = indexHtml.match(/stBuildInfo=\{version:(\d+)/)
      if (search.length === 2) {
        console.log('Phase 1: https://trade.fonero.org/ is at version ' + search[1]);
        return search[1];
      }
      console.log('Phase 1: Unable to find version');
      return -1; // Return 0 when couldn't find anything
    })
    .catch(err => {
      console.error('Phase 1 trade.fonero.org version error: ' + err.message);
      return -1;
    })
}

module.exports = tickerGenerator;
