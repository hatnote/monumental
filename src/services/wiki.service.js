import _ from 'lodash';

const WikiService = function ($http, $httpParamSerializerJQLike) {
  const service = {
    getArticleHeader,
    getCategoryMembers,
    getImage,
    getUserInfo,
    getToken,
    setClaim,
  };

  const defaultParams = {
    action: 'query',
    format: 'json',
    callback: 'JSON_CALLBACK',
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
    const params = angular.extend({}, defaultParams, {
      prop: 'extracts',
      titles: title,
      redirects: true,
      exintro: 1,
    });
    return $http.jsonp(`https://${lang}.wikipedia.org/w/api.php`, {
      params,
      cache: true,
    }).then((response) => {
      return _.values(response.data.query.pages)[0].extract;
    });
  }

  function getCategoryMembers(category) {
    const params = angular.extend({}, categoryFilesParams, { cmtitle: `Category:${category}` });
    return $http.jsonp('https://commons.wikimedia.org/w/api.php', {
      params,
      cache: true,
    }).then((response) => {
      const images = response.data.query.categorymembers.map(image => image.title.substring(5));
      return images;
    });
  }

  function getImage(image, extraParams) {
    const params = angular.extend({}, imageParams, { titles: `File:${image}` }, extraParams);
    return $http.jsonp('https://commons.wikimedia.org/w/api.php', {
      params,
      cache: true,
    }).then((response) => {
      const image = _.head(_.values(response.data.query.pages));
      return angular.extend({}, image, { imageinfo: image.imageinfo[0] });
    });
  }

  function getUserInfo(extraParams) {
    const params = angular.extend({}, defaultParams, {
      meta: 'userinfo|globaluserinfo',
    }, extraParams);
    return $http.jsonp('https://wikidata.org/w/api.php', {
      params,
    }).then(response => response.data.query.globaluserinfo);
  }

  function getToken() {
    return $http.get('/api', {
      params: {
        action: 'query',
        meta: 'tokens',
        use_auth: 'true',
      },
    }).then((response) => {
      if (response.data && response.data.query) {
        return response.data.query.tokens.csrftoken;
      }
      return false;
    });
  }

  function setClaim(params) {
    return $http({
      method: 'POST',
      url: '/api',
      data: $httpParamSerializerJQLike(angular.extend({ use_auth: true }, params)),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }
};

export default () => {
  angular
    .module('monumental')
    .factory('WikiService', WikiService);
};
