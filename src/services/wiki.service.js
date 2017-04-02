import _ from 'lodash';

const WikiService = function ($http, $httpParamSerializerJQLike, $q, $window, wikidata) {
  const service = {
    addCategory,
    getArticleHeader,
    getFilesCategories,
    getCategoryInfo,
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
    iiprop: ['timestamp', 'user', 'url', 'size', 'dimensions', 'canonicaltitle', 'commonmetadata', 'extmetadata'].join('|'),
  });

  return service;

  // functions

  function addCategory(id, value) {
    return wikidata.get({ ids: id })
      .then((response) => {
        const entry = response.entities[id];
        return entry.claims.P373;
      })
      .then((response) => {
        if (response) {
          return $q.reject('Category is already added');
        }
        return setClaim({
          action: 'wbcreateclaim',
          format: 'json',
          entity: `${id}`,
          property: 'P373',
          snaktype: 'value',
          summary: '#monumental',
          value: `"${value}"`,
        });
      });
  }

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

  function getCategoryInfo(category) {
    const params = angular.extend({}, defaultParams, { 
      prop: 'categoryinfo',
      titles: `Category:${category}`,
    });
    return $http.jsonp('https://commons.wikimedia.org/w/api.php', {
      params,
      cache: true,
    }).then((response) => {
      const page = _.sample(response.data.query.pages);
      return angular.extend({}, page.categoryinfo, { title: page.title });
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

  function getFilesCategories(files) {
    const params = angular.extend({}, defaultParams, {
      prop: 'categories',
      clshow: '!hidden',
      cllimit: '250',
      titles: files.join('|'),
    });
    return $http.jsonp('https://commons.wikimedia.org/w/api.php', {
      params,
    }).then(response => response.data.query.pages);
  }

  function getImage(image, extraParams) {
    const params = angular.extend({}, imageParams, { titles: `File:${image}` }, extraParams);
    return $http.jsonp('https://commons.wikimedia.org/w/api.php', {
      params,
      cache: true,
    }).then((response) => {
      const file = _.head(_.values(response.data.query.pages));
      const data = angular.extend({}, file, { imageinfo: file.imageinfo[0] });

      const replacer = data.imageinfo.width > 1280 ? '/1280px-' : `/${data.imageinfo.width - 1}px-`;
      data.imageinfo.thumburlbig = data.imageinfo.thumburl.replace(/\/[0-9]{2,3}px-/, replacer);
      return data;
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
    return $http.get(`${$window.__env.baseUrl}/api`, {
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
      url: `${$window.__env.baseUrl}/api`,
      data: $httpParamSerializerJQLike(angular.extend({ use_auth: true }, params)),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then((response) => {
      if (response.data.status === 'exception') { return $q.reject(response.data.exception); }
      return response;
    });
  }
};

export default () => {
  angular
    .module('monumental')
    .factory('WikiService', WikiService);
};
