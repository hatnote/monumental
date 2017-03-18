import './dashboard.scss';
import template from './dashboard.html';

const DashboardComponent = { controller, template };

function controller($state, $window, WikiService, localStorageService) {
  const vm = this;
  vm.languages = localStorageService.get('languages') || ['en', 'de'];
  vm.loading = false;
  vm.saveLanguages = saveLanguages;

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
