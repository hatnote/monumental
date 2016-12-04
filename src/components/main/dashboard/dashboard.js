import _ from 'lodash';

import './dashboard.scss';
import template from './dashboard.html';

const DashboardComponent = {
  controller: controller,
  template: template
};

function controller () {

}

export default () => {
  angular
    .module('monumental')
    .component('moDashboard', DashboardComponent);
};
