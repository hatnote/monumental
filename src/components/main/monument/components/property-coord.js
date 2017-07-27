const PropertyCoordComponent = {
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
              layout="column" layout-align="start"
              ng-repeat="value in ::$ctrl.claims[$ctrl.property]">
        <a ui-sref="main.map({c: '{{value.mainsnak.datavalue.value.latitude}}:{{value.mainsnak.datavalue.value.longitude}}:16', heritage: '1'})">
          {{ ::value.mainsnak.datavalue.value.latitude | toDMS:'NS' }} &nbsp; {{ ::value.mainsnak.datavalue.value.longitude | toDMS:'EW' }}
        </a>
        <small class="muted">
          {{ ::value.mainsnak.datavalue.value.latitude.toFixed(6) }} {{ ::value.mainsnak.datavalue.value.longitude.toFixed(6) }}
        </small>
      </span>
      <span class="monument__details-value"
              ng-if="!$ctrl.claims[$ctrl.property].length">
        <span class="muted">not provided</span>
      </span>
    </span>`,
};

function controller(wikidata) {
  const vm = this;
  vm.querySearch = text => wikidata.getSearch(text);
}

export default () => {
  angular
    .module('monumental')
    .component('moPropertyCoord', PropertyCoordComponent)
    .filter('toDMS', () => (input, direction) => {
      const dir = input < 0 ? direction[1] : direction[0];
      const absolute = Math.abs(input);
      const deg = parseInt(absolute, 10);
      const t1 = (absolute - deg) * 60;
      const min = parseInt(t1, 10);
      const sec = ((t1 - min) * 60).toFixed(2);
      return `${deg}° ${min}′ ${sec}″ ${dir}`;
    });
};
