const LocationComponent = {
  bindings: { monument: '=' },
  controller,
  template: `<div layout="row" layout-align="start center">
              <span><md-icon>location_city</md-icon></span>
              <span>
                <span ng-repeat="place in $ctrl.location">
                  <a ui-sref="main.list({id: place.value_id.substring(1)})">{{place.value}}</a><span ng-if="!$last"> · </span>
                </span>
                <span class="muted" ng-if="!$ctrl.location">No location provided</span>
              </span>
            </div>`,
};

function controller(wikidata) {
  const vm = this;
  init();

  function init() {
    let prop;
    let id;
    const claims = vm.monument.claims;

    if (claims.P276) {
      prop = 'wdt:P276/wdt:P131';
      id = vm.monument.id;
    } else if (claims.P131) {
      prop = 'wdt:P131';
      const preferred = claims.P131.values.filter(value => value.rank === 'preferred');
      id = preferred.length ? preferred[0].value_id : claims.P131.values[0].value_id;
    } else {
      return;
    }

    wikidata.getRecursive(id, prop).then((response) => {
      vm.location = response;
    });
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moLocation', LocationComponent);
};
