import './main.scss';
import template from './main.html';
import pack from '../../../package.json';

const MainComponent = { controller, template };

function controller() {
  const vm = this;
}

export default () => {
  angular
    .module('monumental')
    .component('moMain', MainComponent);
};
