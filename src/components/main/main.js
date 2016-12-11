import './main.scss';
import template from './main.html';
import pack from '../../../package.json';

const MainComponent = {
  controller: controller,
  template: template
};

function controller(wikidata, $state) {
  let vm = this;

  vm.goToItem = (item) => $state.go('main.monument', {id: item.title});
  vm.querySearch = querySearch;
  vm.search = {};

  function querySearch(text) {
    return wikidata.getSearch(text).then(data => {
      console.log(data);
      return data;
    });
  }

}

export default () => {
  angular
    .module('monumental')
    .component('moMain', MainComponent);
};
