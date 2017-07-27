import _ from 'lodash';
import L from 'leaflet';

import './list.scss';
import template from './list.html';

import barcode from './../../../images/barcode.svg';

const ListComponent = { controller, template };

function controller($location, $q, $scope, $state, $stateParams, $timeout, $window, langService, leafletData, localStorageService, mapService, WikiService, wikidata) {
  const vm = this;
  const id = $stateParams.id.includes('Q') ? $stateParams.id : `Q${$stateParams.id}`;
  let langs = langService.getUserLanguages();

  let canceler = $q.defer();
  let request = null;

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

  vm.image = [];
  vm.lang = langs[0];
  vm.list = null;
  vm.listParams = {};
  vm.loading = 'data';
  vm.map = null;
  vm.mobile = {};
  vm.stateParams = $stateParams;
  vm.stats = null;

  vm.filterMap = filterMap;
  vm.showMyMap = () => { vm.contentScrolled = true; };
  vm.showMyList = () => { vm.contentScrolled = false; };
  vm.zoomToID = zoomToID;

  if (!id || id === 'Q') {
    vm.loading = false;
    return;
  }

  init();

  $scope.$on('centerUrlHash', (event, centerHash) => {
    vm.filter.c = centerHash;
    $state.transitionTo('main.list', vm.filter, { notify: false });
  });

  function createStats(list) {
    const stats = {
      images: 0,
      architect: [],
      style: [],
      type: [],
    };
    list.forEach((element) => {
      if (element.image) { stats.images += 1; }
      ['architect', 'style', 'type'].forEach((param) => {
        if (element[param].length) {
          Array.prototype.push.apply(stats[param], element[param]);
          stats[param] = _.uniqBy(stats[param], 'value_id');
        }
      });
    });
    return stats;
  }

  function getImage(image) {
    WikiService.getImage(image).then((response) => {
      vm.image.push(response.imageinfo);
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

  function getList() {
    canceler.resolve();
    canceler = $q.defer();

    const imageOptions = ['MINUS { ?item wdt:P18 ?image . }', '?item wdt:P18 ?image .'];
    const image = imageOptions[vm.filter.image] || 'OPTIONAL { ?item wdt:P18 ?image . }';

    const wikipediaOptions = ['FILTER NOT EXISTS { ?article schema:about ?item } .', 'FILTER EXISTS { ?article schema:about ?item } .'];
    const wikipedia = wikipediaOptions[vm.filter.wikipedia] || '';
    const admin = vm.isContinent
      ? `?item wdt:P17 ?country . ?country wdt:P30 wd:${id} .`
      : `?admin wdt:P131* wd:${id} .`;

    request = wikidata.getSPARQL(`SELECT DISTINCT ?item ?itemLabel (SAMPLE(?admin) AS ?admin) (SAMPLE(?adminLabel) AS ?adminLabel)
    (SAMPLE(?coord) AS ?coord) (SAMPLE(?image) AS ?image) ?type ?typeLabel ?style ?styleLabel ?architect ?architectLabel
    WHERE {
      ${vm.isContinent ? '' : 'hint:Query hint:optimizer "None" .'}
      ${id === 'Q2' ? '' : admin}
      ?item wdt:P131 ?admin .
      ?item wdt:P625 ?coord .

      ${getHeritageFilter()}
      ${image}
      ${vm.filter.type ? `?item wdt:P31 ?type . ?type wdt:P279* wd:Q${vm.filter.type} .` : 'OPTIONAL { ?item wdt:P31 ?type }'}

      OPTIONAL { ?admin rdfs:label ?adminLabel . FILTER(LANG(?adminLabel) IN ("${langs[0].code}")) }
      OPTIONAL { ?item wdt:P149 ?style }
      OPTIONAL { ?item wdt:P84 ?architect }
      # ?item wdt:P84 ?architect . ?item wdt:P84 wd:Q41508
      ${wikipedia}
      SERVICE wikibase:label { bd:serviceParam wikibase:language "${langs.map(lang => lang.code).join(',')}" }
    }
    GROUP BY ?item ?itemLabel ?type ?typeLabel ?style ?styleLabel ?architect ?architectLabel
    ORDER BY ?itemLabel`, { timeout: canceler.promise });
    return request;
  }

  function getPlace() {
    return wikidata.getById(id).then((data) => {
      vm.place = data;

      if (vm.place.claims.P31 && vm.place.claims.P31.some(claim => claim.mainsnak.datavalue.value.id === 'Q5107')) {
        vm.isContinent = true;
        return false;
      } else if (id === 'Q2') {
        vm.isContinent = true;
        return false;
      }

      const claims = vm.place.claims;
      if (vm.place.claims.P17) {
        const country = claims.P17[0];
        const countryLanguages = langService.getNativeLanguages(country.mainsnak.datavalue.value.id);
        if (!countryLanguages) { return false; }
        langs = langs.concat(countryLanguages.map(lang => ({ code: lang })));
      }
      return true;
    });
  }

  function filterMap() {
    if (!vm.map) { return; }
    $state.transitionTo('main.list', vm.filter, { notify: false });
    vm.loading = 'map';
    getList()
      .then(data => parseList(data))
      .then((list) => {
        vm.stats = createStats(list);
        vm.total = list.length;
        vm.list = list.slice(0, 2000);
        loadMap(vm.list);
      });
  }

  function init() {
    if (!langs) { return; }
    vm.mobile.fullHeader = true;

    getPlace()
      .then(() => {
        let center = { lat: 49.4967, lng: 12.4805, zoom: 4 };
        if (vm.place.claims.P625) {
          const coords = vm.place.claims.P625[0].mainsnak.datavalue.value;
          center = { lat: coords.latitude, lng: coords.longitude, zoom: 7 };
        }
        return $timeout(() => {
          vm.map = mapService.getMapInstance({ center });
        });
      })
      .then(() => setTitle())
      .then(() => getList())
      .then(data => parseList(data))
      .then((list) => {
        vm.stats = createStats(list);
        vm.total = list.length;
        vm.list = list.slice(0, 2000);
        vm.loading = 'map';
        loadMap(vm.list, { fitMap: true });

        let timeout = null;
        $scope.$on('leafletDirectiveMarker.mouseover', (event, marker) => { timeout = $timeout(() => { showPopup(event, marker); }, 250); });
        $scope.$on('leafletDirectiveMarker.mouseout', () => { $timeout.cancel(timeout); });
        $scope.$on('leafletDirectiveMarker.click', showPopup);
      });
  }

  function loadMap(list, options) {
    const bounds = [];
    const markers = {};

    list
      .filter(element => element.coord)
      .forEach((element) => {
        const identifier = element.name.value_id;
        markers[identifier] = {
          data: element,
          lat: element.coord.lat,
          lng: element.coord.lng,
          layer: 'monuments',
          icon: mapService.getMapIcon(element),
        };
        bounds.push(element.coord);
      });

    vm.map.markers = markers;

    if (options && options.fitMap && vm.filter.c.includes(':7')) {
      $timeout(() => {
        leafletData.getMap().then((map) => {
          if (bounds.length) {
            map.fitBounds(bounds, { padding: [25, 25] });
          }
          vm.loading = false;
        });
      });
    } else {
      vm.loading = false;
    }
  }

  function parseList(data) {
    const list = data.map((element) => {
      const obj = {
        name: {
          value_id: URItoID(element.item.value),
          value: element.itemLabel.value,
        },
        admin: {
          value_id: URItoID(element.admin.value),
          value: element.adminLabel ? element.adminLabel.value : URItoID(element.admin.value),
        },
        architect: [],
        style: [],
        type: [],
      };
      if (element.coord.value) {
        const coord = element.coord.value.replace('Point(', '').replace(')', '').split(' ');
        obj.coord = { lat: parseFloat(coord[1]), lng: parseFloat(coord[0]) };
      }
      if (element.image) {
        const image = `${element.image.value.replace('wiki/Special:FilePath', 'w/index.php?title=Special:Redirect/file')}&width=120`;
        obj.image = image;
      }
      if (element.architect) {
        obj.architect = [{
          value_id: URItoID(element.architect.value),
          value: element.architectLabel.value,
        }];
      }
      if (element.style) {
        obj.style = [{
          value_id: URItoID(element.style.value),
          value: element.styleLabel.value,
        }];
      }
      if (element.type) {
        obj.type = [{
          value_id: URItoID(element.type.value),
          value: element.typeLabel.value,
        }];
      }
      return obj;
    }).filter((element, index, array) => {
      const firstIndex = array.findIndex(t => t.name.value_id === element.name.value_id);
      if (firstIndex !== index) {
        const firstElement = array[firstIndex];
        ['architect', 'style', 'type'].forEach((param) => {
          if (element[param].length) {
            firstElement[param].push(_.first(element[param]));
            firstElement[param] = _.uniqBy(firstElement[param], 'value_id');
          }
        });
        return false;
      }
      return true;
    });
    return list;
  }

  function setTitle() {
    const title = vm.place.labels[vm.lang.code].value || vm.place.labels.en.value || vm.place.id;
    $window.document.title = `${title} – Monumental`;
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
                  <p class="muted">${data.admin.value}</p>
                </div>
              </md-list-item>`;

    const popup = L.popup({ autoPan: false }).setContent(text);
    marker.leafletObject.bindPopup(popup);
    marker.leafletObject.openPopup();
  }

  function URItoID(uri) {
    return uri.substring(uri.indexOf('/Q') + 1);
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
    .component('moList', ListComponent);
};
