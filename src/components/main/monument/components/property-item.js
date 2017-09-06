const PropertyItemComponent = {
  bindings: {
    claims: '=',
    edit: '=',
    hidden: '=',
    labels: '=',
    lang: '=',
    link: '=',
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
          <span ng-if="!$ctrl.link">
            {{ ::($ctrl.labels[value.mainsnak.datavalue.value.id][$ctrl.lang.code] || $ctrl.labels[value.mainsnak.datavalue.value.id].en || value.mainsnak.datavalue.value.id) }}
            <md-button class="md-icon-button md-primary" aria-label="Open in Wikidata"
                ng-if="false"
                ng-href="//www.wikidata.org/wiki/{{ ::value.mainsnak.datavalue.value.id }}" target="_blank">
              <md-tooltip>Show Wikidata entry</md-tooltip>
              <md-icon md-svg-icon="assets/images/barcode.svg"></md-icon>
            </md-button>
          </span>
          <a ui-sref="main.object({id: value.mainsnak.datavalue.value.id.substring(1)})"
              ng-if="value.mainsnak.datavalue.value.id && $ctrl.link === true">
            {{ ::($ctrl.labels[value.mainsnak.datavalue.value.id][$ctrl.lang.code] || $ctrl.labels[value.mainsnak.datavalue.value.id].en || value.mainsnak.datavalue.value.id) }}
          </a>
          <a ui-sref="main.list({id: value.mainsnak.datavalue.value.id.substring(1), heritage: 1})"
              ng-if="value.mainsnak.datavalue.value.id && $ctrl.link === 'list'">
            {{ ::($ctrl.labels[value.mainsnak.datavalue.value.id][$ctrl.lang.code] || $ctrl.labels[value.mainsnak.datavalue.value.id].en || value.mainsnak.datavalue.value.id) }}
          </a>
          <div layout="row" layout-align="start center"
              class="monument__details-qualifier"
              ng-repeat="qualifier in ::value.qualifiers">
            <span class="muted" flex="30">{{ ::($ctrl.text[qualifier[0].property][$ctrl.lang.code] || $ctrl.text[qualifier[0].property].en || qualifier[0].property) }}</span>
            <div layout="column" layout-align="start start">
              <span ng-repeat="qualifiervalue in qualifier"
                    ng-init="$ctrl.getFormattedTime(qualifiervalue.datavalue)">
                {{ ::(qualifiervalue.datavalue.value.label[$ctrl.lang.code] || qualifiervalue.datavalue.value.label.en || qualifiervalue.datavalue.value.label) }}
              </span>
            </div>
          </div>
          <span class="muted"
                  ng-if="!value.mainsnak.datavalue.value.id && $first">
            not provided
          </span>
        </div>
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

  vm.getFormattedTime = getFormattedTime;
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

  function getFormattedTime(datavalue) {
    if (!datavalue) { return; }

    if (datavalue.type === 'time') {
      WikiService.getFormattedTime(datavalue.value, vm.lang.code)
        .then((response) => {
          datavalue.value.label = response;
        });
    } else if (datavalue.type === 'wikibase-entityid') {
      WikiService.getLabel(datavalue.value.id)
        .then((response) => {
          datavalue.value.label = response;
        });
    } else if (datavalue.type === 'string') {
      datavalue.value = { label: datavalue.value };
    }
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
