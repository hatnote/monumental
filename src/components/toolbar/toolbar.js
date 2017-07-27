import './toolbar.scss';
import template from './toolbar.html';

const ToolbarComponent = { bindings: { wide: '=' }, controller, template };

function controller($document, $mdSidenav, $mdToast, $state, $timeout, $window, WikiService, wikidata) {
  const vm = this;
  const baseUrl = $window.__env.baseUrl;

  vm.isLoggedIn = false;
  vm.loading = true;
  vm.mobile = {};
  vm.search = { showSearch: false };

  // actions

  vm.goTo = goTo;
  vm.goToItem = goToItem;
  vm.login = login;
  vm.logout = logout;
  vm.mobile.closeSearch = closeSearch;
  vm.mobile.openSearch = openSearch;
  vm.toggleSidebar = () => $mdSidenav('left').toggle();
  vm.querySearch = text => wikidata.getSearch(text);

  init();

  // functions

  function closeSearch() {
    vm.mobile.showSearch = false;
  }

  function goTo(place) {
    vm.toggleSidebar();
    $timeout(() => $state.go(place), 150);
  }

  function goToItem(item) {
    if (!item) { return; }
    wikidata.getRecursive(item.id, 'wdt:P31/wdt:P279').then((response) => {
      const ids = response.map(prop => prop.value_id);
      if (ids.includes('Q56061') || ids.includes('Q5107')) {
        $state.go('main.list', { id: item.id.substring(1), heritage: 1, c: undefined });
      } else if (ids.includes('Q811979')) {
        $state.go('main.object', { id: item.id.substring(1) });
      } else {
        $state.go('main.object', { id: item.id.substring(1) });
        /*
        $mdToast.show($mdToast.simple()
          .position('top right')
          .textContent(`${item.label} is not an architectural structure or territorial entity`)
          .hideDelay(2000));
        */
      }
      closeSearch();
    });
  }

  function init() {
    WikiService.getUserInfo().then((response) => {
      vm.isLoggedIn = response;
      vm.loading = false;
    });
  }

  function login() {
    vm.loading = true;
    const current = $window.location.href;
    $window.location.href = `${baseUrl}/login?next=${encodeURIComponent(current)}`;
  }

  function logout() {
    $window.location.href = `${baseUrl}/logout`;
  }

  function openSearch() {
    vm.mobile.showSearch = true;
    $timeout(() => {
      const input = document.querySelector('#searchField');
      angular.element(input)[0].focus();
      return true;
    }, 100);
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moToolbar', ToolbarComponent)
    .directive('moToolbarScroll', ($window) => {
      let lastPosition = 0;
      return (scope) => {
        angular.element($window).bind('scroll', function () {
          if (this.pageYOffset > lastPosition) { scope.isHidden = true; }
          if (this.pageYOffset < lastPosition) { scope.isHidden = false; }
          lastPosition = this.pageYOffset;
          scope.$apply();
        });
      };
    });
};
