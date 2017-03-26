import './dashboard.scss';
import template from './dashboard.html';

const DashboardComponent = { controller, template };

function controller($mdToast, $state, $window, WikiService, langService) {
  const vm = this;
  vm.languages = langService.getUserLanguages();
  vm.loading = false;
  vm.saveLanguages = saveLanguages;

  function saveLanguages() {
    langService.setUserLanguages(vm.languages.filter(lang => lang))
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
