const React = window.React = require('react');

export default class OpenUp extends React.Component {
  link(content, url) {
    return <a href={url} target="_blank" rel="nofollow noopener noreferrer">{content}</a>
  }
  render() {
    let LOBSTR = this.link('LOBSTR', 'https://lobstr.co/');

    let iOS = this.link('iOS', 'https://itunes.apple.com/us/app/lobstr-fonero-wallet/id1404357892');
    let Android = this.link('Android', 'https://play.google.com/store/apps/details?id=com.lobstr.client');

    return <div className="OpenUp">
    <div className="OpenUp__inside">
      <h2 className="OpenUp__title">The future of FoneroTerm is bright!</h2>
      <br />
      <p>The developers of {LOBSTR} are now leading the future development of FoneroTerm! They built LOBSTR which is one of the leading Fonero wallets on {iOS} and {Android}, rated highly by the Fonero community. Their team has been actively building on the Fonero network since 2015, before FoneroTerm was even made.</p>

      <p>FoneroTerm will continue to be its own product, and receive new developments that it and all its users deserve!</p>

      <p>Thank you all for your support. Exciting times ahead!</p>
    </div></div>
  }
};
