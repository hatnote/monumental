import _ from 'lodash';

import './monument.scss';
import template from './monument.html';

const MonumentComponent = {
  controller: controller,
  template: template
};

function controller($http, $stateParams) {
  let vm = this;

  const id = $stateParams.id;
}

export default () => {
  angular
    .module('monumental')
    .component('moMonument', MonumentComponent);
};
