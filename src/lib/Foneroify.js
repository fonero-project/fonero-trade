import _ from 'lodash';
import directory from '../directory';
import BigNumber from 'bignumber.js';

const Foneroify = {
  // orderbookDetails(input) {
    // Obsolete
  //   const foneroified = input;
  //   foneroified.base = this.asset(input.base);
  //   foneroified.counter = this.asset(input.counter);
  //   return foneroified;
  // },
  asset(input) {
    // Horizon json asset
    if (input.asset_type === 'native') {
      return new FoneroSdk.Asset.native();
    }
    return new FoneroSdk.Asset(input.asset_code, input.asset_issuer);
  },
  assetToml(input) {
    return new FoneroSdk.Asset(input.code, input.issuer);
  },
  memo(type, content) {
    // Type must not be none
    switch (type) {
      case 'MEMO_TEXT':
        return FoneroSdk.Memo.text(content);
      case 'MEMO_ID':
        return FoneroSdk.Memo.id(content);
      case 'MEMO_HASH':
        return FoneroSdk.Memo.hash(content);
      case 'MEMO_RETURN':
        return FoneroSdk.Memo.returnHash(content);
      default:
        throw new Error(`Unknown Foneroify memo type. Got: ${type}`);
    }
  },
  parseAssetSlug(slug) {
    // Takes in a URL part 'FNO-native' or 'USD-foneroterm.com'
    // And converts it into a FoneroSdk.Asset object
    // It will throw errors when it doesn't work
    // Will also do directory conversion
    if (!_.isString(slug)) {
      throw new Error('Foneroify.parseAssetSlug slug must be a string');
    }

    const hyphenIndex = slug.indexOf('-');
    if (hyphenIndex < 1) {
      throw new Error('Foneroify.parseAssetSlug expected slug to be split into two with hyphen');
    }

    const code = slug.substr(0, hyphenIndex);
    let issuer = slug.substr(hyphenIndex + 1);

    if (code.length > 12) {
      throw new Error(`Foneroify.parseAssetSlug expected asset code to be 12 or fewer characters. Input: ${code}`);
    }

    if (issuer === 'native') {
      if (code !== 'FNO') {
        console.error('Native issuers must have FNO code');
      }
      issuer = null;
    } else if (!FoneroSdk.StrKey.isValidEd25519PublicKey(issuer)) {
      // Since it's not a native asset and the issuer wasn't a public key,
      // it could be an asset issued. Lets try to resolve it!
      const asset = directory.getAssetByDomain(code, issuer);
      if (asset !== null) {
        issuer = asset.issuer;
      }
    }

    return new FoneroSdk.Asset(code, issuer);
  },
  assetToSlug(asset) {
    const resolvedAsset = directory.getAssetBySdkAsset(asset);
    if (resolvedAsset === null) {
      return `${asset.getCode()}-${asset.getIssuer()}`;
    }
    return `${resolvedAsset.code}-${resolvedAsset.domain}`;
  },
  pairToExchangeUrl(baseBuying, counterSelling) {
    return `exchange/${this.assetToSlug(baseBuying)}/${this.assetToSlug(counterSelling)}`;
  },
  isOfferRelevant(baseBuying, counterSelling, offer) {
    const offerBuying = this.asset(offer.buying);
    const offerSelling = this.asset(offer.selling);
    return (baseBuying.equals(offerBuying) && counterSelling.equals(offerSelling))
        || (baseBuying.equals(offerSelling) && counterSelling.equals(offerBuying));
  },
  rectifyOffer(baseBuying, counterSelling, offer) {
    const newOffer = _.assign({}, offer);
    // Make sure that the offer is relative to the base/counter pair
    const offerBuying = this.asset(offer.buying);
    const offerSelling = this.asset(offer.selling);
    // / (baseBuying.equals(offerBuying) && counterSelling.equals(offerSelling))
        // || (baseBuying.equals(offerSelling) && counterSelling.equals(offerBuying));
    if (baseBuying.equals(offerBuying) && counterSelling.equals(offerSelling)) {
      // Flip price
      newOffer.side = 'buy';
      newOffer.price_r = {
        d: offer.price_r.n,
        n: offer.price_r.d,
      };
      newOffer.baseAmount = new BigNumber(offer.amount).dividedBy(new BigNumber(newOffer.price_r.n).dividedBy(newOffer.price_r.d)).toFixed(7);
      newOffer.counterAmount = offer.amount;
    } else if (baseBuying.equals(offerSelling) && counterSelling.equals(offerBuying)) {
      // Don't flip
      newOffer.side = 'sell';
      newOffer.baseAmount = offer.amount;
      newOffer.counterAmount = new BigNumber(newOffer.price_r.n).dividedBy(newOffer.price_r.d).times(offer.amount).toFixed(7);
    } else {
      throw new Error('Irrelevant offer passed into rectifyOffer');
    }
    newOffer.amount = undefined;
    newOffer.price = new BigNumber(newOffer.price_r.n).dividedBy(newOffer.price_r.d).toFixed(7);
    return newOffer;
  },
};

export default Foneroify;
