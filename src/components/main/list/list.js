import './list.scss';
import template from './list.html';

import barcode from './../../../images/barcode.svg';

const ListComponent = { controller, template };

function controller($state, $stateParams, $timeout, $window, langService, leafletData, localStorageService, mapService, WikiService, wikidata) {
  const vm = this;
  const icon = mapService.getMapIcon();
  const id = $stateParams.id.includes('Q') ? $stateParams.id : `Q${$stateParams.id}`;
  let langs = langService.getUserLanguages();

  vm.filters = {};
  vm.image = [];
  vm.lang = langs[0];
  vm.listParams = {};
  vm.map = mapService.getMapInstance({ center: { lat: 49.4967, lng: 12.4805, zoom: 4 } });
  vm.mobile = {};
  vm.showMyMap = () => { vm.contentScrolled = true; };
  vm.showMyList = () => { vm.contentScrolled = false; };

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
      OPTIONAL { ?admin rdfs:label ?adminLabel . FILTER(LANG(?adminLabel) IN ("${langs[0].code}")) }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "${langs.map(lang => lang.code).join(',')}" }
    }
    GROUP BY ?item ?itemLabel
    ORDER BY ?itemLabel`);
  }

  function getPlace() {
    return wikidata.getById(id).then((data) => {
      const first = Object.keys(data)[0];
      vm.place = data[first];

      const claims = vm.place.claims;
      if (vm.place.claims.P41) {
        claims.P41.values.forEach(image => getImage(image.value));
      } else if (vm.place.claims.P94) {
        claims.P94.values.forEach(image => getImage(image.value));
      }
      if (vm.place.claims.P17) {
        const country = claims.P17.values[0];
        const countryLanguages = langService.getNativeLanguages(country.value_id);

        if (!countryLanguages) { return false; }
        langs = langs.concat(countryLanguages);
      }
      return true;
    });
  }

  function init() {
    if (!langs) { return; }
    vm.mobile.fullHeader = true;

    getPlace()
      .then(() => setTitle())
      .then(() => getList())
      .then((data) => {
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
            } else if (vm.place.claims.P625) {
              const coords = vm.place.claims.P625.values[0].value;
              vm.map.center = { lat: coords.latitude, lng: coords.longitude, zoom: 10 };
            }
          });
        });
      });
  }

  function setTitle() {
    const title = vm.place.labels[vm.lang.code] || vm.place.labels.en || vm.place.id;
    $window.document.title = `${title} – Monumental`;
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moList', ListComponent);
};
