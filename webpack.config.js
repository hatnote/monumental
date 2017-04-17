var path = require('path');
var webpack = require('webpack');

var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ngAnnotatePlugin = require('ng-annotate-webpack-plugin');

var package = require('./package.json');

var config = {
  context: path.join(__dirname, 'src'),
  entry: ['babel-polyfill', './index.js'],
  output: {
    path: path.join(__dirname, 'monumental', 'static', 'assets'),
    publicPath: 'assets/',
    filename: 'bundle.js?v=' + package.version
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index_local.ejs',
      filename: path.join('..', 'index.html')
    }),
    new CopyWebpackPlugin([
      { from: 'manifest_local.json', to: path.join('..', 'manifest.json') },
      { from: 'app-icons', to: 'app-icons' }
    ]),
    function () {
      this.plugin('watch-run', function (watching, callback) {
        console.log('\n\n---- ' + new Date().toISOString().replace('T', ' ').replace(/\.[0-9]+Z/, '') + ' ----');
        callback();
      })
    }
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          plugins: ['transform-runtime'],
          presets: ['es2015', 'stage-2']
        }
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'ng-annotate',
      },
      {
        test: /\.html?$/, loader: 'raw'
      },
      {
        test: /\.css$/, loader: 'style!css'
      },
      {
        test: /\.scss$/, loader: 'style!css!sass'
      },
      {
        test: /\.(woff|woff2|ttf|eot)$/,
        loader: 'file?name=fonts/[name].[ext]'
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader: 'file?name=images/[name].[ext]'
      },
      {
        test: /\.json$/, loader: 'json'
      }
    ]
  }
};

var ENV = process.env.NODE_ENV;
if (ENV === 'prod' || ENV === 'dev') {
  config.output = {
    path: path.join(__dirname, 'monumental', 'static', 'assets'),
    publicPath: 'assets/',
    filename: 'bundle.min.js?v=' + package.version
  };
  config.plugins = [
    new HtmlWebpackPlugin({
      template: ENV === 'dev' ? 'index_dev.ejs' : 'index_prod.ejs',
      filename: path.join('..', 'index.html')
    }),
    new CopyWebpackPlugin([
      { from: 'manifest_dev.json', to: path.join('..', 'manifest.json') },
      { from: 'app-icons', to: 'app-icons' }
    ]),
    new ngAnnotatePlugin({
      add: true
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      mangle: false
    })
  ];
}

module.exports = config;
