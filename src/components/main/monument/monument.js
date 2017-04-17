import _ from 'lodash';

import './monument.scss';
import template from './monument.html';

import pack from '../../../../package.json';

const MonumentComponent = { controller, template };

function controller($anchorScroll, $http, $mdDialog, $mdMenu, $q, $sce, $stateParams, $timeout, $window, localStorageService, WikiService, imageService, langService, leafletData, mapService, wikidata) {
  const vm = this;
  const icon = mapService.getMapIcon();
  const id = $stateParams.id.includes('Q') ? $stateParams.id : `Q${$stateParams.id}`;
  const langs = langService.getUserLanguages();

  vm.getCommonsLink = getCommonsLink;
  vm.getWikipediaArticle = getWikipediaArticle;
  vm.image = [];
  vm.lang = langs[0];
  vm.map = {};
  vm.openArticleList = (menu, event) => menu.open(event);
  vm.openImage = openImage;
  vm.scrollTo = anchor => $anchorScroll(anchor);

  // init

  init();

  // functions

  function getCategoryInfo(category) {
    WikiService.getCategoryInfo(category).then((response) => {
      vm.category = response;
    });
  }

  function getCategoryMembers(category) {
    WikiService.getCategoryMembers(category).then((data) => {
      const promises = data.map(image => WikiService.getImage(image, { iiurlheight: 75 }));
      $q.all(promises).then((response) => {
        vm.images = response.map(image => image.imageinfo);
      });
    });
  }

  function getWikipediaArticle(wiki) {
    vm.showAllArticles = false;
    WikiService.getArticleHeader(wiki.code, wiki.title).then((data) => {
      wiki.article = $sce.trustAsHtml(data);
      vm.article = wiki;
      $timeout(() => {
        const height = document.querySelector('.article__text').offsetHeight;
        vm.isArticleLong = height === 320;
      });
    });
  }

  function getCommonsLink() {
    const name = vm.monument.claims.P373.values[0].value;
    return `//commons.wikimedia.org/wiki/Category:${encodeURIComponent(name)}`;
  }

  function getImage(image) {
    WikiService.getImage(image, { iiurlwidth: 640 })
      .then((response) => {
        vm.image.push(response.imageinfo);
      });
  }

  function getInterwiki() {
    const country = getPropertyValue('P17');
    const countryLanguages = langService.getNativeLanguages(country.value_id);

    vm.interwiki = {};

    vm.interwiki.all = Object.keys(vm.monument.interwiki)
      .map(key => vm.monument.interwiki[key])
      .map(element => ({
        code: element.site.replace('wiki', ''),
        title: element.title,
        link: `//${element.site.replace('wiki', '')}.wikipedia.org/wiki/${element.title}`.replace(' ', '_'),
      }))
      .filter(element => !element.code.includes('quote') && !element.code.includes('commons'));

    vm.interwiki.shown = langs
      .map(lang => lang.code)
      .concat(countryLanguages)
      .filter((element, index, array) => array.indexOf(element) === index)
      .map((lang) => {
        const iw = vm.interwiki.all.find(element => element.code === lang);
        return iw || { code: lang };
      });

    const article = vm.interwiki.shown.filter(iw => iw.title);
    if (article.length) {
      getWikipediaArticle(article[0]);
    }
  }

  function getPropertyValue(prop) {
    if (vm.monument.claims[prop] && vm.monument.claims[prop].values.length) {
      return vm.monument.claims[prop].values[0];
    }
    return false;
  }

  function init() {
    vm.config = {
      env: $window.__env,
      package: pack,
    };

    vm.loading = true;
    wikidata.getById(id).then((data) => {
      vm.monument = _.sample(data);

      if (getPropertyValue('P18')) {
        const image = getPropertyValue('P18').value;
        getImage(image);
      }
      if (getPropertyValue('P373')) {
        const category = getPropertyValue('P373').value;
        getCategoryInfo(category);
        getCategoryMembers(category);
      }

      getInterwiki();

      if (getPropertyValue('P625')) {
        const value = getPropertyValue('P625').value;
        vm.map = mapService.getMapInstance({
          center: {
            lat: value.latitude,
            lng: value.longitude,
            zoom: 16,
          },
        });
        vm.map.markers = {
          marker: {
            lat: value.latitude,
            lng: value.longitude,
            icon,
          },
        };
        leafletData.getMap().then((map) => {
          map.scrollWheelZoom.disable();
          map.once('focus', () => { map.scrollWheelZoom.enable(); });
        });
      }
      vm.loading = false;

      const title = vm.monument.labels[vm.lang.code] || vm.monument.labels.en || vm.monument.id;
      $window.document.title = `${title} – Monumental`;
    });
  }

  function openImage(image, event) {
    imageService.openImage({
      image,
      event,
      list: vm.images,
    });
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moMonument', MonumentComponent)
    .directive('loadSrc', () => ({
      link: (scope, element, attrs) => {
        let img = null;
        const loadImage = () => {
          element[0].src = '//upload.wikimedia.org/wikipedia/commons/f/f8/Ajax-loader%282%29.gif';
          img = new Image();
          img.src = attrs.loadSrc;
          img.onload = () => { element[0].src = attrs.loadSrc; };
        };
        scope.$watch(() => attrs.loadSrc, (newVal, oldVal) => {
          if (oldVal !== newVal) { loadImage(); }
        });
        loadImage();
      },
  }));
};
