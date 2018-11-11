const React = window.React = require('react');
import AssetCard from '../AssetCard.jsx';
import AddTrustRow from './AddTrustRow.jsx';
import directory from '../../directory';
import _ from 'lodash';

export default class AddTrustFromDirectory extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    let rows = [];
    let added = {}; // Don't duplicate items
    let ticker = this.props.d.ticker;
    if (ticker.ready) {
      for (let i in ticker.data.assets) {
        let tickerAsset = ticker.data.assets[i];
        if (tickerAsset.id !== 'FNO-native') {
          added[tickerAsset.id] = true;
          let sdkAsset = new FoneroSdk.Asset(tickerAsset.code, tickerAsset.issuer);
          rows.push(<AddTrustRow key={tickerAsset.id} d={this.props.d} asset={sdkAsset}></AddTrustRow>);
        }
      }
    }

    _.each(directory.assets, assetObj => {
      let basicSlug = assetObj.code + '-' + assetObj.issuer;
      if (!(basicSlug in added)) {
        let asset = new FoneroSdk.Asset(assetObj.code, assetObj.issuer);
        rows.push(<AddTrustRow key={basicSlug} d={this.props.d} asset={asset}></AddTrustRow>);
      }
    })
    return <div className="island">
      <div className="island__header">
        Accept more assets
      </div>
      <div className="island__paddedContent">
        <p>This is a list of anchors from the Fonero community.<br />Note: FoneroTerm does not endorse any of these anchors.</p>
      </div>
      <div className="AddTrustFromDirectory">
        {rows}
      </div>
    </div>
  }
}
