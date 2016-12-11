import _ from 'lodash';

import './monument.scss';
import template from './monument.html';

const MonumentComponent = {
  controller: controller,
  template: template
};

function controller($http, $q, $sce, $stateParams, $timeout, WikiService, wikidata) {
  let vm = this;
  const id = $stateParams.id;

  vm.getCommonsLink = getCommonsLink;
  vm.lang = 'pl';
  vm.image = [];

  wikidata.setLanguages(['pl', 'en']);
  getWikidata();

  // functions

  function getCategoryMembers(category) {
    WikiService.getCategoryMembers(category).then(data => {
      const promises = data.map(image => WikiService.getImage(image, { iiurlheight: 75 }));
      $q.all(promises).then(data => {
        vm.images = data.map(image => image.imageinfo);
      });
    });
  }

  function getArticleHeader(name) {
    WikiService.getArticleHeader(vm.lang, name).then(data => {
      vm.article = $sce.trustAsHtml(data);
      $timeout(() => {
        let height = document.querySelector('.article__text').offsetHeight;
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

  function getWikidata() {
    wikidata.getById(id).then(data => {
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
      if(vm.monument.interwiki[vm.lang + 'wiki']) {
        getArticleHeader(vm.monument.interwiki[vm.lang + 'wiki'].title);
      }
    });
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moMonument', MonumentComponent);
};
