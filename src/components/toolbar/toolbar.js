import './toolbar.scss';
import template from './toolbar.html';

const ToolbarComponent = { bindings: { wide: '=' }, controller, template };

function controller($mdToast, $state, $window, WikiService, wikidata) {
  const vm = this;
  vm.isLoggedIn = false;
  vm.loading = true;
  vm.search = {};

  // functions

  vm.goToItem = goToItem;
  vm.login = login;
  vm.querySearch = text => wikidata.getSearch(text);

  init();

  function goToItem(item) {
    if (!item) { return; }
    wikidata.getRecursive(item.id, 'wdt:P31/wdt:P279').then((response) => {
      const ids = response.map(prop => prop.value_id);
      if (ids.includes('Q811979')) {
        $state.go('main.object', { id: item.id.substring(1) });
      } else if (ids.includes('Q1496967')) {
        $state.go('main.list', { id: item.id.substring(1) });
      } else {
        $mdToast.show($mdToast.simple()
          .position('top right')
          .textContent(`${item.label} is not an architectural structure or territorial entity`)
          .hideDelay(3000000));
      }
    });
  }

  function init() {
    WikiService.getToken().then((response) => {
      vm.isLoggedIn = response;
      vm.loading = false;
    });
  }

  function login() {
    vm.loading = true;
    $window.location.pathname = '/login';
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moToolbar', ToolbarComponent);
};
