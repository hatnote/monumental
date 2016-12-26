import _ from 'lodash';

import './list.scss';
import template from './list.html';
import '../../../images/marker.png';

const ListComponent = {
  controller: controller,
  template: template
};

function controller($state, $stateParams, $timeout, leafletData, wikidata) {
  let vm = this;
  const ids = $stateParams.id.split('-in-').map(id => id[0] === 'Q' ? id : 'Q' + id);

  vm.map = {};
  vm.listParams = {};

  vm.goToItem = (item) => item ? $state.go('main.list', { id: ids[0].substring(1) + '-in-' + item.id.substring(1) }) : false;
  vm.querySearch = (text) => wikidata.getSearch(text);
  vm.search = {};

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

  wikidata.getSearch(ids[1]).then(results => {
    vm.search.selectedItem = results.length ? results[0] : undefined;
  });

  /*
  wikidata.getLabels(ids).then(labels => {
    angular.extend(vm.listParams, {
      object: {
        id: ids[0],
        label: labels[ids[0]]
      },
      place: {
        id: ids[1],
        label: labels[ids[1]]
      }
    });
  });
  */

  wikidata.getSPARQL(`SELECT DISTINCT ?item ?itemLabel  ?admin ?adminLabel ?coord ?image WHERE {
    ?item p:P1435 ?monument .
    ?item wdt:P131* wd:`+ ids[1] + ` .
    ?item wdt:P131 ?admin .
    ?item wdt:P625 ?coord .
    OPTIONAL { ?item wdt:P18 ?image } 
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
        coord: element.coord.value ? element.coord.value.replace('Point(', '').replace(')', '').split(' ') : false,
        image: element.image ? element.image.value.replace('wiki/Special:FilePath', 'w/index.php?title=Special:Redirect/file') + '&width=75' : false
      }));
      return vm.list;
    }).then(list => {
      let bounds = [];
      list.forEach(element => {
        if (element.coord) {
          vm.map.markers[element.name.value_id] = {
            lat: +element.coord[1],
            lng: +element.coord[0],
            icon: icon
          };
          bounds.push([+element.coord[1], +element.coord[0]]);
        }
      });
      $timeout(() => {
        vm.showMap = true;
        leafletData.getMap().then(function (map) {
          if (bounds.length) {
            map.fitBounds(bounds, { padding: [25, 25] });
          }
        });
      });
    });
}

export default () => {
  angular
    .module('monumental')
    .component('moList', ListComponent);
};
