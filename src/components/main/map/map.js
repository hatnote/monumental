import './map.scss';
import template from './map.html';

const MapComponent = { controller, template };

function controller($location, $scope, $state, $stateParams, $timeout, leafletData, localStorageService, mapService, wikidata) {
  const vm = this;
  const icon = mapService.getMapIcon();

  // bindings

  vm.goToItem = item => setMap(item);
  vm.map = mapService.getMapInstance({ center: { lat: 49.4967, lng: 12.4805, zoom: 4 } });
  vm.querySearch = text => wikidata.getSearch(text);
  vm.list = [];
  vm.listParams = {};
  vm.loading = false;
  vm.loadingMap = true;
  vm.search = {};

  // activate

  let langs = $stateParams.lang ? [$stateParams.lang] : [];
  langs = langs.concat(localStorageService.get('languages') || ['en', 'de']);
  wikidata.setLanguages(langs);

  $scope.$on('centerUrlHash', (event, centerHash) => {
    $location.search({ c: centerHash });
  });

  $timeout(() => {
    vm.loadingMap = false;
    leafletData.getMap().then((map) => {
      if (map.getZoom() > 12) {
        getDataBB(map.getBounds());
      }
      map.on('dragend zoomend', () => {
        if (map.getZoom() > 12) {
          getDataBB(map.getBounds());
        }
      });
    });
  }, 100);

  // functions

  function getDataBB(bounds) {
    vm.loading = true;
    wikidata.getSPARQL(`SELECT ?item ?itemLabel ?admin ?adminLabel ?image ?coord ?heritage WHERE {
        SERVICE wikibase:box {
          ?item wdt:P625 ?coord .
          bd:serviceParam wikibase:cornerWest "Point(${bounds.getSouthWest().lng} ${bounds.getSouthWest().lat})"^^geo:wktLiteral .
          bd:serviceParam wikibase:cornerEast "Point(${bounds.getNorthEast().lng} ${bounds.getNorthEast().lat})"^^geo:wktLiteral .
        }
        OPTIONAL { ?item wdt:P131 ?admin . }
        OPTIONAL { ?item wdt:P18 ?image . }
        ?item wdt:P1435 ?heritage .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "${langs.join(',')}" }
      }`).then((data) => {
        vm.map.markers = {};
        vm.list = data.map(element => setListElement(element));
        vm.list.forEach((element) => {
          vm.map.markers[element.name.value_id] = setMarker(element);
        });
        vm.loading = false;
      });
  }

  function getImage(image) {
    if (image) {
      const newImage = image.value.replace('wiki/Special:FilePath', 'w/index.php?title=Special:Redirect/file');
      return `${newImage}&width=120`;
    }
    return false;
  }

  function getMessage(element) {
    return `<md-list-item class="md-2-line" ui-sref="main.object({id: ${element.name.value_id.substring(1)}})">
        <div class="list__image" layout="row" layout-align="center center">
          <img ng-src="{{'${element.image}'}}" alt="${element.name.value}" ng-if="${!!element.image}">
        </div>
        <div class="md-list-item-text" layout="column">
          <p>${element.name.value}</p>
          <p class="muted">${element.admin ? element.admin.value : ''}</p>
        </div>
      </md-list-item>`;
  }

  function setListElement(element) {
    const id = element.item.value;
    const obj = {
      name: {
        value_id: id.substring(id.indexOf('/Q') + 1),
        value: element.itemLabel.value,
      },
      coord: element.coord.value ? element.coord.value.replace('Point(', '').replace(')', '').split(' ') : false,
      image: getImage(element.image),
    };
    if (element.admin) {
      obj.admin = {
        value_id: element.admin.value.substring(element.admin.value.indexOf('/Q') + 1),
        value: element.adminLabel ? element.adminLabel.value : element.admin.value.substring(element.admin.value.indexOf('/Q') + 1),
      };
    }
    return obj;
  }

  function setMap(item) {
    if (!item || !item.id) { return; }
    vm.loading = true;
    wikidata.getById(item.id)
      .then((data) => {
        const element = Object.values(data)[0];
        const coords = element.claims.P625;
        if (coords) {
          const lat = coords.values[0].value.latitude;
          const lng = coords.values[0].value.longitude;
          leafletData.getMap().then((map) => {
            map.setView([lat, lng], 14);
            getDataBB(map.getBounds());
          });
        }
      });
  }

  function setMarker(element) {
    return {
      lat: +element.coord[1],
      lng: +element.coord[0],
      message: getMessage(element),
      layer: 'monuments',
      icon,
    };
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moMap', MapComponent);
};
