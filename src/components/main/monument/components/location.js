const LocationComponent = {
  bindings: {
    monument: '=',
    params: '=',
  },
  controller,
  template: `<div layout="row" layout-align="start center">
              <span><md-icon>location_city</md-icon></span>
              <span>
                <span ng-repeat="place in $ctrl.location">
                  <a href ng-click="$ctrl.go(place)">{{ place.value }}</a><span ng-if="!$last"> · </span>
                </span>
                <span class="muted" ng-if="!$ctrl.location">No location provided</span>
              </span>
            </div>`,
};

function controller($state, wikidata) {
  const vm = this;
  vm.go = go;

  init();

  function init() {
    let prop;
    let id;
    const claims = vm.monument.claims;

    if (claims.P159) {
      prop = 'wdt:P159/wdt:P131';
      id = vm.monument.id;
    } else if (claims.P276) {
      prop = 'wdt:P276/wdt:P131';
      id = vm.monument.id;
    } else if (claims.P131) {
      prop = 'wdt:P131';
      const preferred = claims.P131.filter(value => value.rank === 'preferred');
      id = preferred.length
        ? preferred[0].mainsnak.datavalue.value.id
        : claims.P131[0].mainsnak.datavalue.value.id;
    } else {
      return;
    }

    wikidata.getRecursive(id, prop).then((response) => {
      vm.location = response;
    });
  }

  function go(place) {
    const params = {};
    if (vm.params) {
      angular.extend(params, vm.params, {
        id: place.value_id.substring(1),
      });
    } else {
      angular.extend(params, {
        id: place.value_id.substring(1),
        heritage: 1,
      });
    }
    $state.go('main.list', params);
  }
}

export default () => {
  angular.module('monumental').component('moLocation', LocationComponent);
};
