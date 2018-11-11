[![Travis CI status](https://travis-ci.org/fonero-project/fonero-trade.svg?branch=master)](https://travis-ci.org/fonero-project/fonero-trade)

# Fonero Trade Ecosystem - [client](https://trade.fonero.org/) | [api](https://github.com/fonero-project/fonero-trade/tree/master/api) | [directory](https://github.com/fonero-project/fonero-trade/blob/master/directory/)
This Fonero Trade monorepo consists of multiple projects built for the [Fonero network](https://www.fonero.org/) including a [trading client](https://trade.fonero.org/). The projects are in this monorepo to enable faster development speed.

## Web Client
Fonero Trade is a web based trading client for use on the Fonero network. This client aims to make it easy and safe for users of any skill level to trade on the Fonero network by making a clear and secure user interface. Try it out at [https://trade.fonero.org](https://trade.fonero.org/)

## API for developers (built on AWS Lambda)
The Fonero Trade API contains information on the markets on the Fonero network. This information is useful for the Fonero Trade client itself as well as other developers that want to use this data.

The API uses the [Serverless framework](https://serverless.com/) for deployment to [AWS Lambda](https://aws.amazon.com/lambda/). The API data is hosted on AWS S3 for high availability.

It is currently under active development and is not yet finished. See it in action here: [https://api.trade.fonero.org/](https://api.trade.fonero.org/)

## [Directory](https://github.com/fonero-project/fonero-trade/blob/master/directory/README.md)
Fonero Trade maintains a manually curated directory file with a listing of well known anchors and assets on the Fonero network. For more information, see the [directory README](https://github.com/fonero-project/fonero-trade/blob/master/directory/README.md).

-------------------------------------------------------------------------------

## Fonero Trade client custom network

### Testnet
To use the testnet, simply add `#testnet` to the url to activate it. To exit, refresh the page where the url is not `#testnet`.

### Custom horizon builds
Some developers may want to use Fonero Trade pointed to a custom horizon server or even a custom network. To do this, you must build Fonero Trade locally.

The Fonero Trade build process checks for the presence of relevant environment variables.

```sh
export FONEROTERM_CUSTOM_HORIZON_URL="https://horizon.trade.fonero-testnet.org"
export FONEROTERM_CUSTOM_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
```

Once built, the configuration will be embedded into the Fonero Trade output file (and the environment variable is no longer needed). To check this, look at the output of `index.html` and search for `stCustomConfig`.

## Deployment
The project is hosted on GitHub pages in the [fonero-project/fonero-trade.github.io](https://github.com/fonero-project/fonero-trade.github.io/) repository. The client is wrapped into a single html file and it's sha 256 sum is recorded on each git commit.

## Client development instructions
### Prerequisites
Make sure you have Node.js 7.4.0 or higher installed. If not, install it ([Node version manager](https://github.com/creationix/nvm) is recommended).

```sh
# Check your node version using this command
node --version
```

### Environment Setup
```sh
# Clone the project
git clone https://github.com/fonero-project/fonero-trade.git
cd fonero-trade

# Install the npm and bower dependencies
npm run setup
```

### Development mode
The build process has tools watches the code and rebuilds if something has changed. It will also serve the app locally (usually http://localhost:3000) and automatically refresh the page when changes are built.

```sh
npm start
```

### Production build
This builds a single index.html file with assets inlined. The single file contains the whole app and can be hosted online. Output file is in `./dist/index.html`.
```sh
npm run production
```

## License
Products in the Fonero Trade Ecosystem is open source software and is licensed under the [Apache-2.0 license](https://github.com/fonero-project/fonero-trade/blob/master/LICENSE-2.0.txt). Please understand the license carefully before using Fonero Trade.

## Credits
- Started the project using the super helpful [react-gulp-browserify yeoman generator](https://github.com/randylien/generator-react-gulp-browserify)
