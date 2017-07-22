const PropertyItemComponent = {
  bindings: {
    claims: '=',
    edit: '=',
    labels: '=',
    lang: '=',
    property: '=',
    text: '=',
  },
  controller,
  template: `
    <span class="muted" flex="35">{{ ::($ctrl.text[$ctrl.property][$ctrl.lang.code] || $ctrl.text[$ctrl.property].en) }}</span>
    <span flex="65"
          layout="column" layout-align="start stretch">
      <span class="monument__details-value"
              ng-repeat="value in ::$ctrl.propertyClaims">
        <a ng-href="http://www.wikidata.org/wiki/{{ ::value.mainsnak.datavalue.value.id }}"
            ng-if="value.mainsnak.datavalue.value.id && !$ctrl.edit.all">
          {{ ::($ctrl.labels[value.mainsnak.datavalue.value.id][$ctrl.lang.code] || $ctrl.labels[value.mainsnak.datavalue.value.id].en || value.mainsnak.datavalue.value.id) }}
        </a>
        <span class="muted"
                ng-if="!value.mainsnak.datavalue.value.id && !$ctrl.edit.all && $first">
          unset
        </span>
        <div class="property__edit"
              layout="row" layout-align="start start"
              ng-if="$ctrl.edit.all"
              ng-class="{'property__edit--deleted': value.action.type === 'remove'}">
          <md-autocomplete flex
              ng-init="value.search = $ctrl.labels[value.mainsnak.datavalue.value.id][$ctrl.lang.code] || $ctrl.labels[value.mainsnak.datavalue.value.id].en || value.mainsnak.datavalue.value.id || ''"
              md-input-name="autocompleteField"
              md-selected-item="value.searchSelected"
              md-selected-item-change="$ctrl.queueEdit(value)"
              md-search-text="value.search"
              md-search-text-change="$ctrl.searchTextChange(value, $last)"
              md-items="item in $ctrl.querySearch(value.search)"
              md-item-text="item.label"
              md-min-length="1"
              md-floating-label="label"
              md-escape-options="blur"
              md-dropdown-position="bottom"
              ng-disabled="value.action.type === 'remove'"
              ng-model-options="{ debounce: 500 }">
            <md-item-template>
              <strong>{{item.label}}</strong>
              <span>{{item.description}}</span> <span class="muted">{{ item.id }}</span>
            </md-item-template>
          </md-autocomplete>

          <md-button class="md-primary" aria-label="Category added"
                      ng-href="//wikidata.org/w/index.php?action=historysubmit&type=revision&diff={{ value.save }}" target="_blank"
                      ng-if="value.save">
            <md-tooltip md-direction="bottom">Click to see diff or revert edit</md-tooltip>
            <md-icon>check_circle</md-icon>
          </md-button>
          <md-button ng-disabled="value.loading"
                      ng-click="$ctrl.queueRemove(value)"
                      ng-if="value.id || value.searchSelected">
            <md-progress-circular md-mode="indeterminate" md-diameter="24px" ng-if="value.loading"></md-progress-circular>
            <md-tooltip md-direction="bottom">Click to remove</md-tooltip>
            <md-icon ng-if="!value.loading">delete</md-icon>
          </md-button>
          <md-button ng-disabled="true"
                      ng-if="!value.id && !value.searchSelected && !value.save"
                      aria-label="Empty">
          </md-button>
        </div>
      </span>
    </span>`,
};

function controller($q, $rootScope, $stateParams, $timeout, wikidata, WikiService) {
  const vm = this;

  vm.propertyClaims = vm.claims[vm.property];

  vm.querySearch = text => wikidata.getSearch(text);
  vm.queueEdit = queueEdit;
  vm.queueRemove = queueRemove;
  vm.searchTextChange = searchTextChange;

  // init

  if (!vm.propertyClaims) {
    vm.claims[vm.property] = [{}];
  } else {
    vm.claims[vm.property].push({});
  }
  vm.propertyClaims = vm.claims[vm.property];

  // functions

  function addClaim(value) {
    return WikiService.addClaimItem({
      entity: `Q${$stateParams.id}`,
      property: vm.property,
      value: +value.searchSelected.title.substring(1),
    });
  }

  /**
   * Add edit to queue
   * @param {Object} value
   */
  function queueEdit(value) {
    if (value.searchSelected) {
      value.save = undefined;
    }
    value.action = {
      type: 'save',
      promise: save,
      value,
    };
    $rootScope.$emit('recountQueue');
  }

  /**
   * Add remove to queue
   * @param {Object} value
   */
  function queueRemove(value) {
    if (value.id) {
      value.action = {
        type: 'remove',
        promise: remove,
        value,
      };
    } else {
      const index = vm.propertyClaims.indexOf(value);
      if (index !== -1) {
        vm.propertyClaims.splice(index, 1);
      }
    }
    $rootScope.$emit('recountQueue');
  }

  function remove(value) {
    return WikiService.removeClaim({ id: value.id });
  }

  function save(value) {
    value.loading = true;
    const action = value.id ? setClaim : addClaim;

    return action(value).then((response) => {
      value.loading = false;
      value.save = response.data.pageinfo.lastrevid;
      value.id = response.data.claim.id;
      value.mainsnak = response.data.claim.mainsnak;
    });
  }

  function searchTextChange(value, isLast) {
    if (value.search && isLast) {
      vm.propertyClaims.push({});
    }
  }

  function setClaim(value) {
    return WikiService.setClaimItem({
      id: value.id,
      property: value.mainsnak.property,
      value: +value.searchSelected.title.substring(1),
    });
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moPropertyItem', PropertyItemComponent);
};
