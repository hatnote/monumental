import '../images/marker.png';

const MapService = () => {
  const service = {
    getMapIcon,
    getMapInstance,
  };

  return service;

  //

  function getMapIcon(options) {
    return angular.extend({
      iconUrl: 'assets/images/marker.png',
      shadowUrl: undefined,
      iconSize: [40, 40],
      shadowSize: [0, 0],
      iconAnchor: [20, 20],
      shadowAnchor: [0, 0],
    }, options);
  }

  function getMapInstance(options) {
    return angular.extend({
      center: {
        lat: 51.686,
        lng: 19.545,
        zoom: 7,
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
              continuousWorld: true,
            },
          },
        },
        overlays: {
          monuments: {
            name: 'Monuments',
            type: 'markercluster',
            visible: true,
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
