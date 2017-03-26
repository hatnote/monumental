import './list.scss';
import template from './list.html';
import '../../../images/marker.png';

const ListComponent = { controller, template };

function controller($state, $stateParams, $timeout, langService, leafletData, localStorageService, mapService, WikiService, wikidata) {
  const vm = this;
  const icon = mapService.getMapIcon();
  const id = $stateParams.id.includes('Q') ? $stateParams.id : `Q${$stateParams.id}`;
  const langs = langService.getUserLanguages();

  vm.filters = {};
  vm.image = [];
  vm.lang = langs[0];
  vm.map = mapService.getMapInstance({ center: { lat: 49.4967, lng: 12.4805, zoom: 4 } });
  vm.listParams = {};

  if (!id || id === 'Q') {
    vm.showMap = true;
    return;
  }

  init();

  function getImage(image) {
    WikiService.getImage(image).then((response) => {
      vm.image.push(response.imageinfo);
    });
  }

  function getList() {
    return wikidata.getSPARQL(`SELECT DISTINCT ?item ?itemLabel
    (SAMPLE(?admin) AS ?admin) (SAMPLE(?adminLabel) AS ?adminLabel) (SAMPLE(?coord) AS ?coord) (SAMPLE(?image) AS ?image)
    WHERE {
      ?item p:P1435 ?monument; wdt:P131* wd:${id}; wdt:P131 ?admin; wdt:P625 ?coord .
      OPTIONAL { ?item wdt:P18 ?image } 
      OPTIONAL { ?admin rdfs:label ?adminLabel. FILTER(LANG(?adminLabel) = "${langs[0]}"). }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "${langs.join(',')}" }
    }
    GROUP BY ?item ?itemLabel
    ORDER BY ?itemLabel`);
  }

  function getPlace() {
    wikidata.getById(id).then((data) => {
      const first = Object.keys(data)[0];
      vm.place = data[first];

      if (vm.place.claims.P18) {
        const claims = vm.place.claims;
        claims.P18.values.forEach(image => getImage(image.value));
      }
    });
  }

  function init() {
    getPlace();
    getList().then((data) => {
      // console.log(data)
      vm.list = data.map(element => ({
        name: {
          value_id: element.item.value.substring(element.item.value.indexOf('/Q') + 1),
          value: element.itemLabel.value,
        },
        admin: {
          value_id: element.admin.value.substring(element.admin.value.indexOf('/Q') + 1),
          value: element.adminLabel ? element.adminLabel.value : element.admin.value.substring(element.admin.value.indexOf('/Q') + 1),
        },
        coord: element.coord.value ? element.coord.value.replace('Point(', '').replace(')', '').split(' ') : false,
        image: element.image ? element.image.value.replace('wiki/Special:FilePath', 'w/index.php?title=Special:Redirect/file') + '&width=120' : false
      }));
      return vm.list;
    }).then((list) => {
      const bounds = [];
      list.forEach((element) => {
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
            icon,
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
}

export default () => {
  angular
    .module('monumental')
    .component('moList', ListComponent);
};
