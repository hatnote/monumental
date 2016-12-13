import _ from 'lodash';

import './list.scss';
import template from './list.html';

const ListComponent = {
  controller: controller,
  template: template
};

function controller($stateParams, wikidata) {
  let vm = this;
  const ids = $stateParams.id.split('-in-').map(id => id[0] === 'Q' ? id : 'Q' + id);

  wikidata.getSPARQL(`SELECT ?item ?itemLabel WHERE {
    ?item wdt:P31 wd:`+ ids[0] + ` .
    ?item wdt:P131* wd:`+ ids[1] + ` .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "pl,en" }
  }`).then(data => {
    vm.list = data.map(element => ({
      value_id: element.item.value.substring(element.item.value.indexOf('/Q') + 1),
      value: element.itemLabel.value
    }));
  });
}

export default () => {
  angular
    .module('monumental')
    .component('moList', ListComponent);
};
