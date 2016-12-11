import _ from 'lodash';

const WikiService = function ($http, $q) {

  const service = {
    getArticleHeader: getArticleHeader,
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
    iiprop: ['timestamp', 'user', 'url', 'size'].join('|'),
  });

  return service;

  // functions

  function getArticleHeader(lang, title) {
    let params = angular.extend({}, defaultParams, {
      prop: 'extracts',
      titles: title,
      redirects: true,
      exintro: 1
    });
    return $http.jsonp('https://' + lang + '.wikipedia.org/w/api.php', {
      params: params,
      cache: true
    }).then(data => {
      return _.values(data.data.query.pages)[0].extract;
    });
  }

  function getCategoryMembers(category) {
    let params = angular.extend({}, categoryFilesParams, { cmtitle: 'Category:' + category });
    return $http.jsonp('https://commons.wikimedia.org/w/api.php', {
      params: params,
      cache: true
    }).then(data => {
      let images = data.data.query.categorymembers.map(image => image.title.substring(5));
      return images;
    });
  }

  function getImage(image, extraParams) {
    let params = angular.extend({}, imageParams, { titles: 'File:' + image }, extraParams);
    return $http.jsonp('https://commons.wikimedia.org/w/api.php', {
      params: params,
      cache: true
    }).then(data => {
      const image = _.head(_.values(data.data.query.pages));
      return angular.extend({}, image, { imageinfo: image.imageinfo[0] });
    });
  }
};

export default () => {
  angular
    .module('monumental')
    .factory('WikiService', WikiService);
};