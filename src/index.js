import angular from 'angular';
import _ from 'lodash';

import 'angular-animate';
import 'angular-leaflet-directive';
import 'angular-material';
import 'angular-messages';
import 'angular-sanitize';
import 'angular-ui-router';
import 'leaflet';
import 'leaflet.markercluster';
import 'ng-infinite-scroll';
import 'restangular';

import './styles/style.scss';
import 'angular-material/angular-material.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'material-design-icons/iconfont/material-icons.css';

import components from './components';
import services from './services';

window._ = _;

angular
  .module('monumental', [
    'ngAnimate',
    'ngMaterial',
    'ngMessages',
    'ngSanitize',
    'ui.router',
    'restangular',
    'infinite-scroll',
    'leaflet-directive'
  ])
  .config(stateConfig)
  .config(themeConfig)
  .config($logProvider => {
    $logProvider.debugEnabled(false);
  });

/**
 * Config of routing
 * 
 * @param {any} $stateProvider
 * @param {any} $urlRouterProvider
 */
function stateConfig($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('main', {
      template: '<mo-main></mo-main>',
      resolve: {}
    })
    .state('main.dashboard', {
      url: '/',
      template: `<mo-dashboard></mo-dashboard>`,
      resolve: {}
    })
    .state('main.list', {
      url: '/list/:id',
      template: `<mo-list></mo-list>`,
      resolve: {}
    })
    .state('main.object', {
      url: '/object/:id?lang',
      template: `<mo-monument></mo-monument>`,
      resolve: {}
    });
  $urlRouterProvider.otherwise('/');
}

/**
 * Config of material design theme
 * 
 * @param {any} $mdThemingProvider
 * @param {any} $provide
 */
function themeConfig($mdThemingProvider, $provide) {
  let tp = $mdThemingProvider;
  tp.definePalette('moRed', tp.extendPalette('red', {
    '500': '#8f0000',
    '600': '#8f0000'
  }));

  tp.alwaysWatchTheme(true);
  tp.theme('default')
    .primaryPalette('moRed')
    .accentPalette('blue');

  $provide.value('themeProvider', tp);
}

components();
services();