import _ from 'lodash';

import './monument.scss';
import template from './monument.html';
import '../../../images/marker.png';

const MonumentComponent = { controller, template };

function controller($http, $q, $sce, $stateParams, $timeout, $window, localStorageService, WikiService, langService, mapService, wikidata) {
  const vm = this;
  const icon = mapService.getMapIcon();
  const id = $stateParams.id.includes('Q') ? $stateParams.id : `Q${$stateParams.id}`;
  const langs = langService.getUserLanguages();

  vm.getCommonsLink = getCommonsLink;
  vm.image = [];
  vm.lang = langs[0];
  vm.map = {};

  getWikidata();

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

  function getArticleHeader(lang, name) {
    const language = lang.replace('wiki', '');
    WikiService.getArticleHeader(language, name).then((data) => {
      vm.article = $sce.trustAsHtml(data);
      $timeout(() => {
        const height = document.querySelector('.article__text').offsetHeight;
        vm.isArticleLong = height === 320;
      });
    });
  }

  function getCommonsLink() {
    const name = vm.monument.claims.P373.values[0].value;
    return `https://commons.wikimedia.org/wiki/Category:${encodeURIComponent(name)}`;
  }

  function getImage() {
    const image = getPropertyValue('P18');
    if (!image) { return; }

    WikiService.getImage(image.value).then((response) => {
      vm.image.push(response.imageinfo);
    });
  }

  function getInterwiki() {
    vm.shownInterwiki = ['de', 'en', 'es', 'fr', 'it', 'ja', 'pl', 'pt', 'ru', 'zh'];
    vm.monument.interwiki = _.mapValues(vm.monument.interwiki, wiki => ({
      code: wiki.site.replace('wiki', ''),
      title: wiki.title,
      link: `https://${wiki.site.replace('wiki', '')}.wikipedia.org/wiki/${wiki.title}`,
    }));
  }

  function getPropertyValue(prop) {
    if (vm.monument.claims[prop] && vm.monument.claims[prop].values.length) {
      return vm.monument.claims[prop].values[0];
    }
    return false;
  }

  function getWikidata() {
    vm.loading = true;
    wikidata.getById(id).then((data) => {
      vm.monument = _.sample(data);
      const claims = vm.monument.claims;

      getImage();
      if (vm.monument.claims.P373) {
        getCategoryInfo(claims.P373.values[0].value);
        getCategoryMembers(claims.P373.values[0].value);
      }

      vm.monument.interwikis = Object.keys(vm.monument.interwiki).length;
      const articleInterwiki = vm.monument.interwiki[`${langs[0]}wiki`] || vm.monument.interwiki[`${langs[1]}wiki`] || vm.monument.interwiki[`${langs[2]}wiki`];
      if (articleInterwiki) {
        getArticleHeader(articleInterwiki.site, articleInterwiki.title);
      }
      if (vm.monument.claims.P625) {
        const value = vm.monument.claims.P625.values[0].value;
        vm.map = mapService.getMapInstance({ center: {
          lat: value.latitude,
          lng: value.longitude,
          zoom: 15,
        } });
        vm.map.markers = {
          marker: {
            lat: value.latitude,
            lng: value.longitude,
            icon,
          },
        };
      }
      getInterwiki();
      vm.loading = false;

      const title = vm.monument.labels[vm.lang] || vm.monument.labels.en || vm.monument.id;
      $window.document.title = `${title} – Monumental`;
    });
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moMonument', MonumentComponent);
};
