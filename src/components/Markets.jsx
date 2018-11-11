const React = window.React = require('react');
import AssetCard from './AssetCard.jsx';
import AssetPair from './AssetPair.jsx';
import AssetList from './AssetList.jsx';
import CustomMarketPicker from './CustomMarketPicker.jsx';
import Foneroify from '../lib/Foneroify';
import ErrorBoundary from './ErrorBoundary.jsx';
import _ from 'lodash';


export default class Markets extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div>
        <div className="so-back islandBack islandBack--t">
          <div className="island">
            <AssetList d={this.props.d}></AssetList>
            <div className="AssetListFooter">
              FoneroTerm does not endorse any of these issuers. They are here for informational purposes only.
              <br />
              To get listed on FoneroTerm, <a href="https://github.com/foneroterm/foneroterm/tree/master/directory" target="_blank" rel="nofollow noopener noreferrer">please read the instructions on GitHub</a>.
            </div>
          </div>
        </div>
        <ErrorBoundary>
          <div className="so-back islandBack">
            <CustomMarketPicker row={true}></CustomMarketPicker>
          </div>
        </ErrorBoundary>
      </div>
    );
  }
};
