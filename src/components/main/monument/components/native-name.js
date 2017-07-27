const NativeNameComponent = {
  bindings: { monument: '=' },
  controller,
  template: '<span ng-repeat="name in ::$ctrl.nativeLabel track by $index">{{ ::name.value }}<span ng-if="!$last"> · </span></span>',
};

function controller(langService) {
  const vm = this;
  vm.nativeLabel = getNativeLabel();

  function getNativeLabel() {
    const country = getPropertyValue('P17');
    const languages = langService.getNativeLanguages(country.id) || ['en'];
    return languages.map(lang => vm.monument.labels[lang]).filter(name => name);
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
    .component('moNativeName', NativeNameComponent);
};
