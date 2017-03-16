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
    if (vm.languages.includes('en')) {
      vm.languages.push('en');
    }
    localStorageService.set('languages', vm.languages.filter(lang => lang));
    $state.reload();
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moDashboard', DashboardComponent);
};
