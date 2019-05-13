import angular from 'angular';
import _ from 'lodash';

import 'angular-animate';
import 'angular-file-upload';
import 'angular-leaflet-directive';
import 'angular-local-storage';
import 'angular-material';
import 'angular-messages';
import 'angular-sanitize';
import 'angular-swipe';
import 'angular-ui-router';
import 'leaflet';
import 'leaflet.markercluster';
import 'ng-infinite-scroll';
import 'restangular';

import 'angular-material/angular-material.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'material-design-icons/iconfont/material-icons.css';
import './styles/style.scss';

import components from './components';
import services from './services';

window._ = _;

angular
  .module('monumental', [
    'angularFileUpload',
    'ngAnimate',
    'ngMaterial',
    'ngMessages',
    'ngSanitize',
    'ui.router',
    'restangular',
    'swipe',
    'infinite-scroll',
    'leaflet-directive',
    'LocalStorageModule',
  ])
  .config(localStorageConfig)
  .config(stateConfig)
  .config(themeConfig)
  .config($logProvider => {
    $logProvider.debugEnabled(false);
  })
  .run(($rootScope, $state, $stateParams) => {
    $rootScope.$on('$stateChangeSuccess', () => {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    });
  });

function localStorageConfig(localStorageServiceProvider) {
  localStorageServiceProvider.setPrefix('monumental').setStorageType('localStorage');
}

/**
 * Config of routing
 *
 * @param {any} $stateProvider
 * @param {any} $urlRouterProvider
 */
function stateConfig($stateProvider, $urlRouterProvider, $locationProvider) {
  $stateProvider
    .state('main', {
      template: '<mo-main></mo-main>',
      resolve: {},
    })
    .state('main.dashboard', {
      url: '/',
      template: '<mo-dashboard></mo-dashboard>',
      resolve: {},
    })
    .state('main.list', {
      url: '/list/:id?c',
      template: '<mo-institution-list></mo-institution-list>',
      resolve: {},
    })
    .state('main.map', {
      url: '/map?c&heritage&image&type&wikipedia',
      template: '<mo-map></mo-map>',
      resolve: {},
    })
    .state('main.object', {
      url: '/object/:id',
      template: '<mo-monument></mo-monument>',
      resolve: {},
    })
    .state('main.museum', {
      url: '/institution/:id',
      template: '<mo-museum></mo-museum>',
      resolve: {},
    })
    .state('main.game', {
      abstract: true,
      url: '/games',
      template: '<div ui-view ng-cloak><p>Loading</p></div>',
    })
    .state('main.game.category', {
      url: '/add-category?country',
      template: '<mo-game-category></mo-game-category>',
      resolve: {},
    });
  $urlRouterProvider.otherwise('/');
  // $locationProvider.html5Mode(true);
}

/**
 * Config of material design theme
 *
 * @param {any} $mdThemingProvider
 * @param {any} $provide
 */
function themeConfig($mdThemingProvider, $provide) {
  const tp = $mdThemingProvider;
  tp.definePalette(
    'belize',
    tp.extendPalette('blue', {
      500: '#096',
      600: '#096',
    }),
  );

  // tp.alwaysWatchTheme(true);
  tp.theme('default')
    .primaryPalette('belize')
    .accentPalette('grey');

  $provide.value('themeProvider', tp);
}

components();
services();
