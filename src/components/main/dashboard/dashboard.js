import './dashboard.scss';
import template from './dashboard.html';

const DashboardComponent = { controller, template };

function controller($filter, $mdToast, $state, $window, WikiService, langService) {
  const vm = this;
  vm.lang = {};
  vm.languagesList = langService.getLanguagesList();
  vm.languages = langService.getUserLanguages();
  vm.loading = false;
  vm.saveUserLanguages = saveUserLanguages;
  vm.searchLang = text => $filter('filter')(vm.languagesList, text);
  vm.setLanguage = (lang) => { vm.languages.push(lang.code); };

  init();

  function init() {
    $window.document.title = 'Dashboard – Monumental';
  }

  function saveUserLanguages() {
    langService.setUserLanguages(vm.languages)
      .then(() => {
        $mdToast.show($mdToast.simple().textContent('Languages saved!').hideDelay(3000));
        $state.reload();
      });
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moDashboard', DashboardComponent);
};
