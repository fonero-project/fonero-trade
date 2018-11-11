const React = window.React = require('react');
import _ from 'lodash';
import Validate from '../lib/Validate';
import directory from '../directory';


export default class AssetPickerNarrow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      code: '',
      issuer: '',
    }

    this.handleInput = (type, e) => {
      e.preventDefault();
      let newState = _.assign({}, this.state)
      if (type === 'code') {
        newState.code = e.target.value;
      } else {
        newState.issuer = e.target.value;
      }
      this.setState(newState)
      let result = this.checkInputs(newState);
      this.props.onUpdate(result);
    }
  }
  checkInputs(newState) {
    if (newState.code === 'FNO' && newState.issuer === '') {
      return FoneroSdk.Asset.native();
    }

    let assetByAccountId = directory.getAssetByAccountId(newState.code, newState.issuer);
    if (assetByAccountId !== null) {
      return new FoneroSdk.Asset(assetByAccountId.code, assetByAccountId.issuer);
    }

    let assetByDomain = directory.getAssetByDomain(newState.code, newState.issuer);
    if (assetByDomain !== null) {
      return new FoneroSdk.Asset(assetByDomain.code, assetByDomain.issuer);
    }

    if (Validate.publicKey(newState.issuer).ready && Validate.assetCode(newState.code)) {
      return new FoneroSdk.Asset(newState.code, newState.issuer);
    }

    return null;
  }
  render() {
    return <div>
      <label className="s-inputGroup AssetPickerNarrow__inputGroup AssetPickerNarrow__code">
        <span className="s-inputGroup__item AssetPickerNarrow__tag s-inputGroup__item--tag S-flexItem-full">
          <span>Asset Code</span>
        </span>
        <input className="s-inputGroup__item AssetPickerNarrow__input S-flexItem-full" type="text" value={this.state.code} onChange={e => this.handleInput('code', e)} placeholder="example: FNO" />
      </label>
      <label className="s-inputGroup AssetPickerNarrow__inputGroup AssetPickerNarrow__issuer">
        <span className="s-inputGroup__item AssetPickerNarrow__tag s-inputGroup__item--tag S-flexItem-full">
          <span>Issuer Account ID or federation</span>
        </span>
        <input className="s-inputGroup__item AssetPickerNarrow__input S-flexItem-full" type="text" value={this.state.issuer} onChange={e => this.handleInput('issuer', e)} placeholder="example: naobtc.com or GC4DJYMFQZVX3R56FVCN3WA7FJFKT24VI67ODTZUENSE4YNUXZ3WYI7R" />
      </label>
    </div>
  }
};
