import _ from 'lodash';

import './monument.scss';
import template from './monument.html';

const MonumentComponent = {
  controller: controller,
  template: template
};

function controller($http, $stateParams, wikidata) {
  let vm = this;

  const id = $stateParams.id;
  wikidata.getById(id).then(data => {
    console.log(data[Object.keys(data)[0]]);
    vm.monument = data[Object.keys(data)[0]];
  });
}

export default () => {
  angular
    .module('monumental')
    .component('moMonument', MonumentComponent);
};
