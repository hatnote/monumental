import './dashboard.scss';
import template from './dashboard.html';

const DashboardComponent = { controller, template };

function controller($state, localStorageService) {
  const vm = this;
  vm.languages = localStorageService.get('languages') || ['en', 'de'];
  vm.saveLanguages = saveLanguages;

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
