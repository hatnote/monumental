import _ from 'lodash';

import './monument.scss';
import template from './monument.html';
import '../../../images/marker.png';

const MonumentComponent = { controller, template };

function controller($http, $q, $sce, $stateParams, $timeout, $window, localStorageService, WikiService, wikidata) {
  const vm = this;
  const id = $stateParams.id[0] === 'Q' ? $stateParams.id : `Q${$stateParams.id}`;

  vm.getCommonsLink = getCommonsLink;
  vm.image = [];
  vm.map = {};

  let langs = $stateParams.lang ? [$stateParams.lang] : [];
  langs = langs.concat(localStorageService.get('languages') || ['en', 'de']);

  vm.lang = langs[0];
  wikidata.setLanguages(langs);
  getWikidata();

  // functions

  function getCategoryMembers(category) {
    WikiService.getCategoryMembers(category).then((data) => {
      const promises = data.map(image => WikiService.getImage(image, { iiurlheight: 75 }));
      $q.all(promises).then((data) => {
        vm.images = data.map(image => image.imageinfo);
      });
    });
  }

  function getArticleHeader(name) {
    WikiService.getArticleHeader(vm.lang, name).then((data) => {
      vm.article = $sce.trustAsHtml(data);
      $timeout(() => {
        const height = document.querySelector('.article__text').offsetHeight;
        vm.isArticleLong = height === 320;
      });
    });
  }

  function getCommonsLink() {
    const name = vm.monument.claims.P373.values[0].value;
    return 'https://commons.wikimedia.org/wiki/Category:' + encodeURIComponent(name);
  }

  function getFullLocation(id) {
    wikidata.getRecursive(id, 'P131').then(data => {
      vm.location = data;
    });
  }

  function getImage(image) {
    WikiService.getImage(image).then(data => {
      vm.image.push(data.imageinfo);
    });
  }

  function getInterwiki() {
    vm.shownInterwiki = ['de', 'en', 'es', 'fr', 'it', 'ja', 'pl', 'pt', 'ru', 'zh'];
    vm.monument.interwiki = _.mapValues(vm.monument.interwiki, wiki => ({
      code: wiki.site.replace('wiki', ''),
      title: wiki.title,
      link: 'https://' + wiki.site.replace('wiki', '') + '.wikipedia.org/wiki/' + wiki.title
    }));
  }

  function getWikidata() {
    vm.loading = true;
    wikidata.getById(id).then((data) => {
      const first = Object.keys(data)[0];
      vm.monument = data[first];
      const claims = vm.monument.claims;

      if (vm.monument.claims.P18) {
        claims.P18.values.forEach(image => getImage(image.value));
      }
      if (vm.monument.claims.P373) {
        getCategoryMembers(claims.P373.values[0].value);
      }
      if (vm.monument.claims.P131) {
        getFullLocation(claims.P131.values[0].value_id);
      }
      if (vm.monument.interwiki[`${vm.lang}wiki`]) {
        getArticleHeader(vm.monument.interwiki[`${vm.lang}wiki`].title);
      }
      if (vm.monument.claims.P625) {
        const value = vm.monument.claims.P625.values[0].value;
        const icon = {
          iconUrl: 'assets/images/marker.png',
          shadowUrl: undefined,
          iconSize: [40, 40],
          shadowSize: [0, 0],
          iconAnchor: [20, 20],
          shadowAnchor: [0, 0]
        };

        vm.map = {
          center: {
            lat: value.latitude,
            lng: value.longitude,
            zoom: 15
          },
          markers: {
            marker: {
              lat: value.latitude,
              lng: value.longitude,
              icon: icon
            }
          }
        };
      }
      getInterwiki();
      vm.loading = false;

      let title = vm.monument.labels[vm.lang] || vm.monument.labels.en || vm.monument.id;
      $window.document.title = title + ' – Monumental';
    });
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moMonument', MonumentComponent);
};
