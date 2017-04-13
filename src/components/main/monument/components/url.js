const UrlComponent = {
  bindings: { monument: '<' },
  controller,
  template: `<div layout="row" layout-align="start start">
    <div flex="none"><md-icon>link</md-icon></div>
    <span ng-if="::$ctrl.value" flex><a ng-href="{{ ::$ctrl.value }}" target="_blank">{{ ::$ctrl.label }}</a></span>
    <span class="muted" ng-if="::!$ctrl.value" flex>no official website</span>
  </div>`,
};

function controller() {
  const vm = this;
  init();

  function init() {
    if (vm.monument && vm.monument.claims && vm.monument.claims.P856) {
      const values = vm.monument.claims.P856.values;
      vm.value = values[0].value;
      vm.label = values[0].value.replace(/^https?:\/\/(www\.)?/, '').replace(/^\/|\/$/g, '');
    }
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moUrl', UrlComponent);
};
