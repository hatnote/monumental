import './dashboard.scss';
import template from './dashboard.html';

const DashboardComponent = { controller, template };

function controller($state, $window, WikiService, localStorageService) {
  const vm = this;
  vm.languages = localStorageService.get('languages') || ['en', 'de'];
  vm.loading = false;
  vm.login = login;
  vm.saveLanguages = saveLanguages;

  init();

  function init() {
    WikiService.getToken().then((data) => {
      console.log(data);
    });
  }

  function login() {
    vm.loading = true;
    $window.location.pathname = '/login';
  }

  function saveLanguages() {
    vm.languages.indexOf('en') === -1 ? vm.languages.push('en') : false;
    localStorageService.set('languages', vm.languages.filter(lang => lang));
    $state.reload();
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moDashboard', DashboardComponent);
};
