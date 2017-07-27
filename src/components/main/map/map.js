import L from 'leaflet';

import './map.scss';
import template from './map.html';

const MapComponent = { controller, template };

function controller($location, $q, $scope, $state, $stateParams, $timeout, $window, langService, leafletData, localStorageService, mapService, wikidata) {
  const vm = this;
  const langs = langService.getUserLanguages();

  let canceler = $q.defer();
  let request = null;

  // bindings

  vm.dict = {
    types: [
      { label: 'Art', value: '838948' },
      { label: 'Building', value: '41176' },
      { label: 'Castle', value: '23413' },
      { label: 'Cemetery', value: '39614' },
      { label: 'Library', value: '7075' },
      { label: 'Manor house', value: '879050' },
      { label: 'Park', value: '22698' },
      { label: 'Place of worship', value: '1370598' },
      { label: 'Residential building', value: '11755880' },
    ],
  };
  vm.filter = angular.extend({ heritage: 1 }, $stateParams);
  vm.list = [];
  vm.listParams = {};
  vm.loading = false;
  vm.loadingMap = true;

  vm.map = mapService.getMapInstance({ center: { lat: 49.4967, lng: 12.4805, zoom: 4 } });

  vm.filterMap = filterMap;
  vm.showMyMap = () => { vm.contentScrolled = true; };
  vm.showMyList = () => { vm.contentScrolled = false; };
  vm.zoomToID = zoomToID;

  // init

  init();

  // functions

  function filterMap() {
    $state.transitionTo('main.map', vm.filter, { notify: false });
    leafletData.getMap().then((map) => {
      if (map.getZoom() > 10) {
        getDataBB(map.getBounds());
      }
    });
  }

  function init() {
    $scope.$on('centerUrlHash', (event, centerHash) => {
      vm.filter.c = centerHash;
      $state.transitionTo('main.map', vm.filter, { notify: false });
    });

    $timeout(() => {
      vm.loadingMap = false;
      leafletData.getMap().then((map) => {
        if (map.getZoom() > 10) {
          getDataBB(map.getBounds());
        }
        map.on('dragend zoomend', () => {
          if (map.getZoom() > 10) {
            getDataBB(map.getBounds());
          }
        });
        map.on('dragstart zoomstart', () => {
          canceler.resolve();
        });
      });
    }, 100);

    $window.document.title = 'Monumental';
  }

  function getDataBB(bounds) {
    vm.loading = true;
    canceler.resolve();
    canceler = $q.defer();

    const imageOptions = ['MINUS { ?item wdt:P18 ?image . }', '?item wdt:P18 ?image .'];
    const image = imageOptions[vm.filter.image] || 'OPTIONAL { ?item wdt:P18 ?image . }';

    const wikipediaOptions = ['FILTER NOT EXISTS { ?article schema:about ?item } .', 'FILTER EXISTS { ?article schema:about ?item } .'];
    const wikipedia = wikipediaOptions[vm.filter.wikipedia] || '';

    request = wikidata.getSPARQL(`SELECT ?item ?itemLabel ?admin ?adminLabel ?image ?coord ?heritage WHERE {
        SERVICE wikibase:box {
          ?item wdt:P625 ?coord .
          bd:serviceParam wikibase:cornerWest "Point(${bounds.getSouthWest().lng} ${bounds.getSouthWest().lat})"^^geo:wktLiteral .
          bd:serviceParam wikibase:cornerEast "Point(${bounds.getNorthEast().lng} ${bounds.getNorthEast().lat})"^^geo:wktLiteral .
        }
        OPTIONAL { ?item wdt:P131 ?admin . }
        ${image}
        ${getHeritageFilter()}
        ${vm.filter.type ? `?item wdt:P31 ?type . ?type wdt:P279* wd:Q${vm.filter.type} .` : 'OPTIONAL { ?item wdt:P31 ?type }'}
        ${wikipedia}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "${langs.map(lang => lang.code).join(',')}" }
      }`, { timeout: canceler.promise });

    request.then((data) => {
      vm.map.markers = {};
      // http://stackoverflow.com/a/36744732/1418878
      const list = data
        .map(element => setListElement(element))
        .filter((element, index, array) => array.findIndex(t => t.name.value_id === element.name.value_id) === index);
      vm.total = list.length;
      vm.list = list
        .slice(0, 2000)
        .sort((a, b) => (a.name.value > b.name.value) ? 1 : ((b.name.value > a.name.value) ? -1 : 0));
      vm.list.forEach((element) => {
        vm.map.markers[element.name.value_id] = setMarker(element);
      });

      let timeout = null;
      $scope.$on('leafletDirectiveMarker.mouseover', (event, marker) => { timeout = $timeout(() => { showPopup(event, marker); }, 250); });
      $scope.$on('leafletDirectiveMarker.mouseout', () => { $timeout.cancel(timeout); });
      $scope.$on('leafletDirectiveMarker.click', showPopup);
      vm.loading = false;
    }).catch(() => {
      vm.loading = false;
    });
  }

  function getHeritageFilter() {
    const query = '?item p:P1435 ?monument .';
    const value = vm.filter.heritage;
    if (angular.isUndefined(value)) { return `OPTIONAL { ${query} }`; }
    if (parseInt(value, 10) === 0) { return `MINUS { ${query} }`; }
    if (parseInt(value, 10) === 1) { return `${query}`; }
    if (parseInt(value, 10) > 1) { return `?item wdt:P1435 wd:Q${value} .`; }
    return '';
  }

  /**
   * Gets link to image
   * @param {String} image
   */
  function getImage(image) {
    if (image) {
      const newImage = image.value.replace('wiki/Special:FilePath', 'w/index.php?title=Special:Redirect/file');
      return `${newImage}&width=120`;
    }
    return false;
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
      data: element,
      lat: +element.coord[1],
      lng: +element.coord[0],
      layer: 'monuments',
      icon: mapService.getMapIcon(element),
    };
  }

  function showPopup(event, marker) {
    if (marker.leafletEvent.type === 'click') {
      const item = vm.list.filter(element => element.name.value_id === marker.model.data.name.value_id)[0];
      vm.highlighted = item.name.value_id;
      vm.topIndex = vm.list.indexOf(item);
    }

    if (marker.leafletObject.getPopup() && marker.leafletObject.isPopupOpen()) {
      return;
    }
    if (marker.leafletObject.getPopup() && !marker.leafletObject.isPopupOpen()) {
      marker.leafletObject.openPopup();
      return;
    }

    const data = marker.model.data;
    const text = `<md-list-item class="md-2-line"
                    ui-sref="main.object({id: ${data.name.value_id.substring(1)}})">
                <div class="list__image" layout="row" layout-align="center center" ng-if="${!!data.image}">
                  <img ng-src="{{::'${data.image}'}}">
                </div>
                <div class="md-list-item-text" layout="column">
                  <p>${data.name.value}</p>
                  <p class="muted">${data.admin ? data.admin.value : ''}</p>
                </div>
              </md-list-item>`;

    const popup = L.popup({ autoPan: false }).setContent(text);
    marker.leafletObject.bindPopup(popup);
    marker.leafletObject.openPopup();
  }

  function zoomToID(pinId) {
    const marker = vm.map.markers[pinId];
    $q.all({
      map: leafletData.getMap(),
      markers: leafletData.getMarkers(),
    }).then((data) => {
      data.map.setView([marker.lat, marker.lng], 17);
      showPopup(null, {
        leafletObject: data.markers[pinId],
        leafletEvent: {},
        model: marker,
      });
    });
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moMap', MapComponent);
};
