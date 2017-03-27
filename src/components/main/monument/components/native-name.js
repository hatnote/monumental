const NativeNameComponent = {
  bindings: { monument: '=' },
  controller,
  template: '<span ng-repeat="name in ::$ctrl.getNativeLabel()">{{ ::name }}<span ng-if="!$last"> · </span></span>',
};

function controller(langService) {
  const vm = this;
  vm.getNativeLabel = getNativeLabel;

  function getNativeLabel() {
    const country = getPropertyValue('P17');
    const languages = langService.getNativeLanguages(country.value_id);
    return languages.map(lang => vm.monument.labels[lang]).filter(name => name);
  }

  function getPropertyValue(prop) {
    if (vm.monument.claims[prop] && vm.monument.claims[prop].values.length) {
      return vm.monument.claims[prop].values[0];
    }
    return false;
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moNativeName', NativeNameComponent);
};
