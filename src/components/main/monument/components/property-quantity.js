const PropertyQuantityComponent = {
  bindings: {
    claims: '=',
    edit: '=',
    hidden: '=',
    labels: '=',
    lang: '=',
    property: '=',
    text: '=',
  },
  controller,
  template: `
    <span class="muted" flex="35"
            ng-if="$ctrl.edit.all || (!$ctrl.edit.all && !$ctrl.hidden)">
      {{ ::($ctrl.text[$ctrl.property][$ctrl.lang.code] || $ctrl.text[$ctrl.property].en) }}
    </span>
    <span flex="65"
          layout="column" layout-align="start stretch">
      <span class="monument__details-value"
              ng-repeat="value in ::$ctrl.propertyClaims">
        <div class="monument__details-edit" ng-if="!$ctrl.edit.all && !$ctrl.hidden">
          {{ ::value.mainsnak.datavalue.value.amount | number }}
          <span class="muted">{{ ::($ctrl.text[value.mainsnak.datavalue.value.unit.substring(31)][$ctrl.lang.code] || $ctrl.text[value.mainsnak.datavalue.value.unit.substring(31)].en) }}</span>
          <span class="muted"
                  ng-if="!value.mainsnak.datavalue.value.amount && $first">
            not provided
          </span>
        </div>
        <div class="property__edit"
              layout="row" layout-align="start start" 
              ng-if="$ctrl.edit.all"
              ng-class="{'property__edit--deleted': value.action.type === 'remove'}">
          <md-input-container flex
                    ng-init="value.newValue = value.mainsnak.datavalue.value.amount">
            <input type="text" aria-label="Value"
                    ng-model="value.newValue"
                    ng-change="$ctrl.queueEdit(value, $last)"
                    ng-disabled="value.action.type === 'remove'">
          </md-input-container>
          <div ng-init="value.unit = value.mainsnak.datavalue.value.unit.substring(31)">
            {{ $ctrl.text[value.unit][$ctrl.lang.code] || $ctrl.text[value.unit].en }}
          </div>
          <md-button class="md-primary" aria-label="Category added"
                      ng-href="//wikidata.org/w/index.php?action=historysubmit&type=revision&diff={{ value.save }}" target="_blank"
                      ng-if="$ctrl.edit.all && value.save">
            <md-tooltip md-direction="bottom">Click to see diff or revert edit</md-tooltip>
            <md-icon>check_circle</md-icon>
          </md-button>
          <md-button ng-disabled="value.loading"
                      ng-click="$ctrl.queueRemove(value)"
                      ng-if="value.id || value.newValue">
            <md-progress-circular md-mode="indeterminate" md-diameter="24px" ng-if="value.loading"></md-progress-circular>
            <md-tooltip md-direction="bottom">Click to remove</md-tooltip>
            <md-icon ng-if="!value.loading">delete</md-icon>
          </md-button>
        </div>
      </span>
    </span>`,
};

function controller($q, $rootScope, $stateParams, wikidata, WikiService) {
  const vm = this;

  vm.propertyClaims = vm.claims[vm.property];

  vm.queueEdit = queueEdit;
  vm.queueRemove = queueRemove;

  // init

  if (!vm.propertyClaims) {
    vm.claims[vm.property] = [{}];
  } else {
    vm.claims[vm.property].push({});
  }
  vm.propertyClaims = vm.claims[vm.property];

  // functions

  function addClaim(value) {
    return WikiService.addClaimString({
      entity: `Q${$stateParams.id}`,
      property: vm.property,
      value: angular.toJson({
        amount: value.newValue,
        unit: value.unit ? `//www.wikidata.org/entity/${value.unit}` : undefined,
      }),
    });
  }

  /**
   * Add edit to queue
   * @param {Object} value
   */
  function queueEdit(value, isLast) {
    if (value.newValue && isLast) {
      vm.propertyClaims.push({});
    }

    value.save = undefined;
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

    action(value).then((response) => {
      value.loading = false;
      if (response.error) {
        value.error = response.error.info;
      } else {
        value.save = response.data.pageinfo.lastrevid;
        value.id = response.data.claim.id;
        value.mainsnak = response.data.claim.mainsnak;
      }
    });
  }

  function setClaim(value) {
    return WikiService.setClaimQuantity({
      id: value.id,
      property: value.mainsnak.property,
      value: value.newValue,
      unit: value.mainsnak.datavalue.value.unit,
    });
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moPropertyQuantity', PropertyQuantityComponent);
};
