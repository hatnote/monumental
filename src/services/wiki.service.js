import _ from 'lodash';

const WikiService = function ($http, $httpParamSerializerJQLike, $q, $window, wikidata) {
  const service = {
    addCategory,
    addClaimItem,
    addClaimString,
    getArticleHeader,
    getFilesCategories,
    getFormattedTime,
    getCategoryInfo,
    getCategoryMembers,
    getCategorySearch,
    getImage,
    getLabel,
    getUserInfo,
    removeClaim,
    setClaimItem,
    setClaimQuantity,
    setClaimString,
    setLabel,
  };

  const appAPI = `${$window.__env.baseUrl}/api`;

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
        return postWikidata({
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

  function setLabel(id, lang, value) {
    return postWikidata({
      action: 'wbsetlabel',
      format: 'json',
      id: `${id}`,
      language: `${lang}`,
      summary: '#monumental',
      value: `${value}`,
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

  function getCategorySearch(name) {
    const params = angular.extend({}, defaultParams, {
      action: 'query',
      list: 'search',
      srsearch: name,
      srnamespace: 14,
      srlimit: 20,
      srprop: 'timestamp',
    });
    return $http.jsonp('https://commons.wikimedia.org/w/api.php', {
      params,
    }).then(response => response.data.query.search);
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

  function getFormattedTime(value, lang) {
    return wikidata.get({
      action: 'wbformatvalue',
      props: undefined,
      options: angular.toJson({ lang }),
      generate: 'text/plain',
      property: 'P585',
      datavalue: angular.toJson({ value, type: 'time' }),
    }).then(response => response.result);
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

  function getLabel(id) {
    return wikidata.getLabels([id])
      .then(response => response[id]);
  }

  function getUserInfo() {
    return $http.get(appAPI, {
      params: {
        action: 'query',
        meta: 'globaluserinfo',
        use_auth: 'true',
      },
    }).then((response) => {
      if (response.data && response.data.query) {
        return response.data.query.globaluserinfo;
      }
      return false;
    });
  }

  function addClaimItem(value) {
    return postWikidata({
      action: 'wbcreateclaim',
      format: 'json',
      entity: value.entity,
      property: value.property,
      snaktype: 'value',
      value: angular.toJson({
        'entity-type': 'item',
        'numeric-id': value.value,
      }),
      summary: '#monumental',
    });
  }

  function addClaimString(value) {
    return postWikidata({
      action: 'wbcreateclaim',
      format: 'json',
      entity: value.entity,
      property: value.property,
      snaktype: 'value',
      value: value.value,
      summary: '#monumental',
    });
  }

  function removeClaim(value) {
    return postWikidata({
      action: 'wbremoveclaims',
      format: 'json',
      claim: value.id,
      summary: '#monumental',
    });
  }

  function setClaimItem(value) {
    return postWikidata({
      action: 'wbsetclaim',
      format: 'json',
      claim: angular.toJson({
        id: value.id,
        type: 'claim',
        mainsnak: {
          snaktype: 'value',
          property: value.property,
          datavalue: {
            type: 'wikibase-entityid',
            value: {
              'entity-type': 'item',
              'numeric-id': value.value,
            },
          },
        },
      }),
      summary: '#monumental',
    });
  }

  function setClaimQuantity(value) {
    return postWikidata({
      action: 'wbsetclaim',
      format: 'json',
      claim: angular.toJson({
        id: value.id,
        type: 'claim',
        mainsnak: {
          snaktype: 'value',
          property: value.property,
          datavalue: {
            type: 'quantity',
            value: {
              amount: value.value,
              unit: value.unit,
            },
          },
        },
      }),
      summary: '#monumental',
    });
  }

  function setClaimString(value) {
    return postWikidata({
      action: 'wbsetclaim',
      format: 'json',
      claim: angular.toJson({
        id: value.id,
        type: 'claim',
        mainsnak: {
          snaktype: 'value',
          property: value.property,
          datavalue: {
            type: 'string',
            value: value.value,
          },
        },
      }),
      summary: '#monumental',
    });
  }

  function postWikidata(params) {
    return $http({
      method: 'POST',
      url: appAPI,
      // data: angular.extend({ use_auth: true }, params),
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
