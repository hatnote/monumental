import _ from 'lodash';

import './monument.scss';
import template from './monument.html';

const MonumentComponent = {
  controller: controller,
  template: template
};

function controller($http, $q, $stateParams, CommonsService, wikidata) {
  let vm = this;
  const id = $stateParams.id;
  
  getWikidata();

  // functions

  function getCategoryMembers(category) {
    CommonsService.getCategoryMembers(category).then(data => {
      const promises = data.map(image => CommonsService.getImage(image, {iiurlheight: 75}));
      $q.all(promises).then(data => {
        vm.images = data.map(image => image.imageinfo);
      });
    });
  }

  function getImage(image) {
    CommonsService.getImage(image).then(data => {
      vm.image = data.imageinfo;
    });
  }

  function getWikidata() {
    wikidata.getById(id).then(data => {
      const first = Object.keys(data)[0];
      vm.monument = data[first];
      const claims = vm.monument.claims;

      if(vm.monument.claims.P18) {
        getImage(claims.P18.values[0].value);
      }
      if(vm.monument.claims.P373) {
        getCategoryMembers(claims.P373.values[0].value);
      }

      
    });
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moMonument', MonumentComponent);
};
