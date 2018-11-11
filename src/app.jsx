const React = window.React = require('react');
const ReactDOM = require('react-dom');
const mountNode = document.getElementById('app');
import GlobalModal from './components/GlobalModal.jsx';
import NotFound from './components/NotFound.jsx';
import AssetList from './components/AssetList.jsx';
import Markets from './components/Markets.jsx';
import Session from './components/Session.jsx';
import Exchange from './components/Exchange.jsx';
import Generic from './components/Generic.jsx';
import Download from './components/Download.jsx';
import Loading from './components/Loading.jsx';
import OpenUp from './components/OpenUp.jsx';
import Foneroify from './lib/Foneroify';
import url from 'url';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import TermsOfUse from './components/TermsOfUse.jsx';
import Driver from './lib/Driver';

let network = {
  horizonUrl: 'https://horizon.trade.fonero.org',
  networkPassphrase: FoneroSdk.Networks.PUBLIC,
  isDefault: true, // If it's default, then we don't show a notice bar at the top
  isTestnet: false,
  isCustom: false,
};

if (window.location.hash === '#testnet') {
  network.isDefault = false;
  network.isTestnet = true;
  network.horizonUrl = 'https://horizon.trade.fonero-testnet.org';
  network.networkPassphrase = FoneroSdk.Networks.TESTNET;
} else if (window.stCustomConfig.horizonUrl) {
  network.isDefault = false;
  network.isCustom = true;
  network.horizonUrl = window.stCustomConfig.horizonUrl;
  if (window.stCustomConfig.networkPassphrase) {
    network.networkPassphrase = window.stCustomConfig.networkPassphrase;
  }
}

FoneroSdk.Network.use(new FoneroSdk.Network(network.networkPassphrase));

let driver = new Driver({
  network,
});

const parseUrl = (href) => {
  let hash = url.parse(href).hash;
  if (hash === null) {
    return '';
  }
  return hash.substr(1);
}

class TermApp extends React.Component {
  constructor(props) {
    super(props);
    this.d = props.d;
    this.state = {
      // The url is the hash cleaned up
      url: parseUrl(window.location.href)
    };
    window.addEventListener('hashchange', (e) => {
      if (e.newURL.indexOf('/#testnet') !== -1) {
        window.location.reload();
      }
      this.setState({
        url: parseUrl(e.newURL)
      })
    } , false);
  }

  renderHomePageActions() {
    const { d: { session: { state } } } = this.props;
    return state === 'out' && (
      <div className="HomePage__lead__actions">
        <a
          className="HomePage__lead__actions__sign-up-button HomePage__lead__actions__button s-button"
          href="#signup"
        >
          Sign Up
        </a>
        &nbsp;
        <a
          className="s-button HomePage__lead__actions__button"
          href="#account"
        >
          Login
        </a>
      </div>
    );
  }

  render() {
    let url = this.state.url;
    let urlParts = url.split('/');

    let body;
    if (url === '') {
      // Home page
      body = <div>
        <div className="HomePage__black">
          <div className="so-back">
            <OpenUp />
            <div className="HomePage__lead">
              <h2 className="HomePage__lead__title">Trade on the <a href="#exchange">Fonero Decentralized Exchange</a></h2>
              <p className="HomePage__lead__summary">FoneroTerm is an <a href="https://github.com/fonero-project/fonero-trade" target="_blank" rel="nofollow noopener noreferrer">open source</a> client for the <a href="https://www.fonero.org/" target="_blank" rel="nofollow noopener noreferrer">Fonero network</a>. <br />Send, receive, and <a href="#exchange">trade</a> assets on the Fonero network easily with Fonero Trade.</p>
              {this.renderHomePageActions()}
            </div>
          </div>
        </div>
        <div className="so-back islandBack HomePage__assetList">
          <div className="island">
            <AssetList d={this.props.d} limit={6}></AssetList>
            <div className="AssetListFooter">
              View more assets on the <a href="#markets">market list page</a>.
            </div>
          </div>
        </div>
        <div className="so-back islandBack">
          <div className="island">
            <div className="island__sub">
              <div className="island__sub__division">
                <div className="HomePage__sideBlurb">
                  <p>Fonero Trade is just a client that can be used to access the Fonero Decentralized Exchange. Neither Fonero Trade nor the developers of it are involved with operating the Fonero network.</p>
                  <p>Fonero Trade is developed by Ultra Fonero, LLC, the same company that developed the LOBSTR wallet. The project is independent of the Fonero Development Foundation.</p>
                </div>
              </div>
              <div className="island__sub__division">
                <div className="HomePage__sideBlurb">
                  <p>Fonero Trade is open source software. To support the project, please <a href="https://github.com/fonero-project/fonero-trade" target="_blank" rel="nofollow noopener noreferrer">star the project on GitHub</a>.</p>
                  <p>The project is released under the Apache-2.0 license and is released as is without warranty.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    } else if (urlParts[0] === 'download') {
      body = <Download />
    } else if (urlParts[0] === 'testnet') {
      if (network.isTestnet) {
        body = <Generic title="Test network">
          You are running on the <a href="https://www.fonero.org/developers/guides/concepts/test-net.html" target="_blank" rel="nofollow noopener noreferrer">Fonero test network</a>. This network is for development purposes only and the test network may be occasionally reset.
          <br />
          To create a test account on the test network, use the <a href="https://www.fonero.org/laboratory/#account-creator?network=test"  target="_blank" rel="nofollow noopener noreferrer">Friendbot to get some test foneros</a>.
        </Generic>
      } else {
        body = <Generic title="Please refresh the page to switch to testnet"><Loading darker={true}>
          Please refresh the page to switch to testnet.
        </Loading></Generic>
      }
    } else if (urlParts[0] === 'privacy') {
      body = <Generic title="Privacy Policy">
        <p>This policy may be updated or revised without notice. It is the responsibility of the user to stay informed about privacy policy changes.</p>
        <p>Fonero Trade does not track your actions on this client.</p>
        <p>Fonero Trade does not store cookies and the website does not contain any analytics scripts.</p>
        <p>Fonero Trade developers never see your private keys.</p>
        <p>However, Fonero Trade is hosted on GitHub, AWS, and Cloudflare infrastructure. They may and do have their own tracking systems on their servers. Those services have their own privacy policies and they are not covered by this privacy policy.</p>
        <p>While Fonero Trade does not track you, this does not mean your actions are private. Take note of other privacy issues that may affect you:</p>
        <ul className="privacy__ul">
          <li>Fonero is a public ledger. Anyone can see anything that happens on the network.</li>
          <li>Your inflation vote is publicly visible.</li>
          <li>Your computer might be compromised.</li>
          <li>The Fonero Trade website might be compromised.</li>
        </ul>
      </Generic>
    } else if (urlParts[0] === 'terms-of-use') {
      body = <TermsOfUse />
    } else if (['account', 'signup', 'ledger'].indexOf(urlParts[0]) > -1) {
      body = <Session d={this.d} urlParts={urlParts}></Session>
    } else if (urlParts[0] === 'markets') {
      body = <Markets d={this.d}></Markets>
    } else if (urlParts[0] === 'exchange') {
      if (urlParts.length === 3) {
        try {
          let baseBuying = Foneroify.parseAssetSlug(urlParts[1]);
          let counterSelling = Foneroify.parseAssetSlug(urlParts[2]);

          this.d.orderbook.handlers.setOrderbook(baseBuying, counterSelling);
          body = <Exchange d={this.d}></Exchange>
        } catch (e) {
          console.error(e);
          body = <Generic title="Pick a market">Exchange url was invalid. To begin, go to the <a href="#markets">market list page</a> and pick a trading pair.</Generic>
        }
      } else {
        if (this.d.orderbook.data.ready) {
          setTimeout(() => {
            let newUrl = Foneroify.pairToExchangeUrl(this.d.orderbook.data.baseBuying, this.d.orderbook.data.counterSelling);
            history.replaceState(null, null, '#' + newUrl);
            this.setState({
              url: newUrl,
            })
          }, 0);
          body = <Generic title="Loading orderbook">Loading</Generic>
        } else {
          // Default to a market with good activity
          let baseBuying = new FoneroSdk.Asset('MOBI', 'GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH');
          let counterSelling = FoneroSdk.Asset.native();

          this.d.orderbook.handlers.setOrderbook(baseBuying, counterSelling);
          setTimeout(() => {
            let newUrl = Foneroify.pairToExchangeUrl(baseBuying, counterSelling);
            history.replaceState(null, null, '#' + newUrl);
            this.setState({
              url: newUrl,
            })
          }, 0);
        }
      }
    } else {
      body = <NotFound></NotFound>
    }

    return <div className="AppStretch">
      <GlobalModal d={this.props.d}></GlobalModal>
      <div className="AppStretch AppContainer">
        <div>
          <Header d={this.props.d} urlParts={urlParts} network={network}></Header>
          {body}
        </div>
        <Footer />
      </div>
    </div>;

  }
};

ReactDOM.render(<TermApp d={driver} />, mountNode);
