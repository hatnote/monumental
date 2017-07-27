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
    if (getPropertyValue('P856')) {
      vm.value = getPropertyValue('P856');
      vm.label = vm.value.replace(/^https?:\/\/(www\.)?/, '').replace(/^\/|\/$/g, '');
    }
  }

  function getPropertyValue(prop) {
    if (!vm.monument.claims[prop]) return false;
    const value = vm.monument.claims[prop][0];

    return value.mainsnak.datavalue.value;
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moUrl', UrlComponent);
};
