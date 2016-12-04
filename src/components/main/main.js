import './main.scss';
import template from './main.html';
import pack from '../../../package.json';

const MainComponent = {
  controller: controller,
  template: template
};

function controller() {

}

export default () => {
  angular
    .module('monumental')
    .component('moMain', MainComponent);
};
