import L from 'leaflet';

import '../images/marker-red.png';
import '../images/marker-shadow.png';

const MapService = () => {
  const service = {
    getMapIcon,
    getMapInstance,
  };

  return service;

  //

  function getMapIcon(options) {
    return angular.extend({
      iconUrl: 'assets/images/marker-red.png',
      shadowUrl: 'assets/images/marker-shadow.png',
      iconSize: [29, 41],
      shadowSize: [41, 41],
      iconAnchor: [15, 41],
      shadowAnchor: [12, 41],
      popupAnchor: [0, -43],
    }, options);
  }

  function getMapInstance(options) {
    return angular.extend({
      markersWatchOptions: {
        doWatch: true,
        isDeep: false,
        individual: {
          doWatch: false,
          isDeep: false,
        },
      },
      center: {
        lat: 51.686,
        lng: 19.545,
        zoom: 7,
      },
      markers: {},
      events: {
        markers: {
          enable: ['click', 'mouseover', 'mouseout'],
        },
      },
      layers: {
        baselayers: {
          wiki: {
            name: 'Wikimedia Maps',
            type: 'xyz',
            url: '//maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
            layerOptions: {
              subdomains: ['a', 'b', 'c'],
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              continuousWorld: true,
              maxNativeZoom: 18,
              maxZoom: 21,
            },
          },
          osm: {
            name: 'OpenStreetMap',
            type: 'xyz',
            url: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            layerOptions: {
              subdomains: ['a', 'b', 'c'],
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              continuousWorld: true,
              maxNativeZoom: 19,
              maxZoom: 21,
            },
          },
        },
        overlays: {
          monuments: {
            name: 'Monuments',
            type: 'markercluster',
            visible: true,
            layerOptions: {
              spiderfyOnMaxZoom: false,
              showCoverageOnHover: false,
              zoomToBoundsOnClick: true,
              disableClusteringAtZoom: 17,
              animate: false,
              iconCreateFunction: cluster => new L.DivIcon({
                html: `<div><span>${cluster.getChildCount()}</span></div>`,
                className: 'marker-cluster marker-cluster-small',
                iconSize: new L.Point(40, 40),
              }),
            },
          },
        },
      },
    }, options);
  }
};

export default () => {
  angular
    .module('monumental')
    .factory('mapService', MapService);
};
