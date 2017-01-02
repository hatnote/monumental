import './main.scss';
import template from './main.html';
import pack from '../../../package.json';

const MainComponent = {
  controller: controller,
  template: template
};

function controller(wikidata, $state, $stateParams, localStorageService) {
  let vm = this;

  let langs = $stateParams.lang ? [$stateParams.lang] : [];
  langs = langs.concat(localStorageService.get('languages') || ['en', 'de']);

  vm.lang = langs[0];
  wikidata.setLanguages(langs);

  vm.goToItem = (item) => $state.go('main.object', {id: item.title.substring(1)});
  vm.querySearch = (text) => wikidata.getSearch(text);
  vm.search = {};
}

export default () => {
  angular
    .module('monumental')
    .component('moMain', MainComponent);
};
