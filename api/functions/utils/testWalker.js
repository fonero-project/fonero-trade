const _ = require('lodash');
const FoneroSdk = require('fonero-sdk');
const directory = require('../../directory.json');
const tradeWalker = require('./tradeWalker');

Server = new FoneroSdk.Server('https://horizon.trade.fonero.org');
FoneroSdk.Network.usePublicNetwork();



tradeWalker.walkUntil(Server, {
  code: 'FNO',
  issuer: null,
}, {
  code:'BTC',
  issuer: 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF'
}, 86400)
.then(result => {
  console.log(result)
})
