import _ from 'lodash';

import './list.scss';
import template from './list.html';
import '../../../images/marker.png';

const ListComponent = {
  controller: controller,
  template: template
};

function controller($state, $stateParams, $timeout, leafletData, localStorageService, wikidata) {
  let vm = this;
  const id = $stateParams.id[0] === 'Q' ? $stateParams.id : 'Q' + $stateParams.id;

  vm.map = {};
  vm.listParams = {};

  vm.goToItem = (item) => item ? $state.go('main.list', { id: item.id.substring(1) }) : false;
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
    markers: {},
    layers: {
      baselayers: {
        osm: {
          name: 'OpenStreetMap',
          type: 'xyz',
          url: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          layerOptions: {
            subdomains: ['a', 'b', 'c'],
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            continuousWorld: true
          }
        }
      },
      overlays: {
        monuments: {
          name: 'Monuments',
          type: 'markercluster',
          visible: true
        }
      }
    }
  };

  if (!id || id === 'Q') {
    vm.showMap = true;
    return;
  }

  let langs = $stateParams.lang ? [$stateParams.lang] : [];
  langs = langs.concat(localStorageService.get('languages') || ['en', 'de']);
  wikidata.setLanguages(langs);

  wikidata.getSearch(id).then(results => {
    vm.search.selectedItem = results.length ? results[0] : undefined;
  });

  wikidata.getSPARQL(`SELECT DISTINCT ?item ?itemLabel (SAMPLE(?admin) AS ?admin) (SAMPLE(?adminLabel) AS ?adminLabel) (SAMPLE(?coord) AS ?coord) (SAMPLE(?image) AS ?image)
    WHERE {
        ?item p:P1435 ?monument .
        ?item wdt:P131* wd:` + id + ` .
        ?item wdt:P131 ?admin .
        ?item wdt:P625 ?coord .
        OPTIONAL { ?item wdt:P18 ?image } 
        OPTIONAL { ?admin rdfs:label ?adminLabel. FILTER(LANG(?adminLabel) = "` + langs[0] + `"). }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "` + langs.join(',') + `" }
    }
    GROUP BY ?item ?itemLabel
    ORDER BY ?itemLabel`).then(data => {
      // console.log(data)
      vm.list = data.map(element => ({
        name: {
          value_id: element.item.value.substring(element.item.value.indexOf('/Q') + 1),
          value: element.itemLabel.value
        },
        admin: {
          value_id: element.admin.value.substring(element.admin.value.indexOf('/Q') + 1),
          value: element.adminLabel ? element.adminLabel.value : element.admin.value.substring(element.admin.value.indexOf('/Q') + 1)
        },
        coord: element.coord.value ? element.coord.value.replace('Point(', '').replace(')', '').split(' ') : false,
        image: element.image ? element.image.value.replace('wiki/Special:FilePath', 'w/index.php?title=Special:Redirect/file') + '&width=120' : false
      }));
      return vm.list;
    }).then(list => {
      let bounds = [];
      list.forEach(element => {
        if (element.coord) {
          vm.map.markers[element.name.value_id] = {
            lat: +element.coord[1],
            lng: +element.coord[0],
            message: `
                <md-list-item class="md-2-line"
                    ui-sref="main.object({id: ${element.name.value_id.substring(1)}})">
                <div class="list__image" layout="row" layout-align="center center">
                  <img ng-src="{{'${element.image}'}}" alt="${element.name.value}" ng-if="${!!element.image}">
                </div>
                <div class="md-list-item-text" layout="column">
                  <p>${element.name.value}</p>
                  <p class="muted">${element.admin.value}</p>
                </div>
              </md-list-item>`,
            layer: 'monuments',
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
