import _ from 'lodash';

const commonsService = function ($http, $q) {

  const service = {
    getCategoryMembers: getCategoryMembers,
    getImage: getImage
  };

  const defaultParams = {
    action: 'query',
    format: 'json',
    callback: 'JSON_CALLBACK'
  };

  const categoryFilesParams = angular.extend({}, defaultParams, {
      list: 'categorymembers',
      cmprop: 'title',
      cmtype: 'file',
      cmlimit: 10,
    });

  const imageParams = angular.extend({}, defaultParams, {
    prop: 'imageinfo',
    iiurlwidth: 300,
    iiurlheight: 300,
    iiprop: ['timestamp', 'user', 'url', 'size'].join('|'),
  });
  
  return service;

  // functions

  function getCategoryMembers(category) {
    let params = angular.extend({}, categoryFilesParams, { cmtitle: 'Category:' + category});
    return $http.jsonp('https://commons.wikimedia.org/w/api.php', {
      params: params,
      cache: true
    }).then(data => {
      let images = data.data.query.categorymembers.map(image => image.title.substring(5));
      return images;
    });
  }

  function getImage(image, extraParams) {
    let params = angular.extend({}, imageParams, { titles: 'File:' + image}, extraParams);
    return $http.jsonp('https://commons.wikimedia.org/w/api.php', {
      params: params,
      cache: true
    }).then(data => {
      const image = _.head(_.values(data.data.query.pages));
      return angular.extend(image, {imageinfo: image.imageinfo[0]});
    });
  }
};

export default () => {
  angular
    .module('monumental')
    .factory('CommonsService', commonsService);
};