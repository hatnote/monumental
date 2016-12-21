import _ from 'lodash';

import './list.scss';
import template from './list.html';
import '../../../images/marker.png';

const ListComponent = {
  controller: controller,
  template: template
};

function controller($stateParams, $timeout, wikidata) {
  let vm = this;
  vm.map = {};

  const ids = $stateParams.id.split('-in-').map(id => id[0] === 'Q' ? id : 'Q' + id);
  const icon = {
    iconUrl: 'assets/images/marker.png',
    shadowUrl: undefined,
    iconSize: [40, 40],
    shadowSize: [0, 0],
    iconAnchor: [20, 20],
    shadowAnchor: [0, 0]
  };

  vm.map = {
    center: {
      lat: 51.686,
      lng: 19.545,
      zoom: 7
    },
    markers: {}
  };

  wikidata.getSPARQL(`SELECT ?item ?itemLabel  ?admin ?adminLabel ?coord WHERE {
    ?item wdt:P31 wd:`+ ids[0] + ` .
    ?item wdt:P131* wd:`+ ids[1] + ` .
    ?item wdt:P131 ?admin .
    ?item wdt:P625 ?coord .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "pl,en" }
  }`).then(data => {
    console.log(data)
    vm.list = data.map(element => ({
      name: {
        value_id: element.item.value.substring(element.item.value.indexOf('/Q') + 1),
        value: element.itemLabel.value
      },
      admin: {
        value_id: element.admin.value.substring(element.admin.value.indexOf('/Q') + 1),
        value: element.adminLabel.value
      },
      coord: element.coord.value ? element.coord.value.replace('Point(', '').replace(')', '').split(' ') : false
    }));
    return vm.list;
  }).then(list => {
    list.forEach(element => {
      if(element.coord) {
        vm.map.markers[element.name.value_id] = {
          lat: +element.coord[1],
          lng: +element.coord[0],
          icon: icon
        };
      }
    });
    $timeout(() => {
      vm.showMap = true;
    });
  });
}

export default () => {
  angular
    .module('monumental')
    .component('moList', ListComponent);
};
