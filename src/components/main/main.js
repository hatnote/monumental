import './main.scss';
import template from './main.html';
import pack from '../../../package.json';

const MainComponent = {
  controller: controller,
  template: template
};

function controller(wikidata, $state) {
  let vm = this;

  vm.goToItem = (item) => $state.go('main.object', {id: item.title.substring(1)});
  vm.querySearch = (text) => wikidata.getSearch(text);
  vm.search = {};

}

export default () => {
  angular
    .module('monumental')
    .component('moMain', MainComponent);
};
