var webpackConfig = require('./webpack.config.js');
webpackConfig.entry = {};

module.exports = function (config) {
  config.set({
    browsers: ['PhantomJS'],
    plugins: [
      'karma-babel-preprocessor',
      'karma-phantomjs-launcher',
      'karma-jasmine',
      'karma-webpack'
    ],
    files: [
      './test/env.js',
      './app/assets/bundle.js',
      './node_modules/angular/angular.js',
      './node_modules/angular-mocks/angular-mocks.js',
      './src/**/*.spec.js'],
    preprocessors: {
      './app/assets/bundle.js': ['webpack'],
      './src/**/*.spec.js': ['babel']
    },
    frameworks: ['jasmine'],
    webpack: webpackConfig,
    webpackServer: {
      noInfo: true
    }
  });
};