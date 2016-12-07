const wdService = function ($http, $q) {

  const service = {
    getById: getById
  };

  const defaultParams = {
    action: 'wbgetentities',
    format: 'json',
    props: ['info', 'labels', 'descriptions', 'claims', 'datatype'],
    languages: ['pl', 'en'],
    sitefilter: 'plwiki',
    callback: 'JSON_CALLBACK'
  };

  /**
   * Iterates over own enumerable string keyed properties of an object and
   * invokes `func` for each property..
   * 
   * @param {Object} object The object to iterate over
   * @param {Function} func The function invoked per iteration
   * @returns {Object} Returns `object`
   */
  function forOwn(object, func) {
    let key;
    for (key in object) {
      if (!object.hasOwnProperty(key)) { continue; }
      func.call(object, object[key], key);
    }
    return object;
  }

  /**
   * 
   * 
   * @param {Object} data
   * @returns {Promise}
   */
  function get(data) {
    let params = angular.extend(angular.copy(defaultParams), data);
    return $http.jsonp('https://www.wikidata.org/w/api.php', {
      params: mapValues(params, p => angular.isArray(p) ? p.join('|') : p),
      cache: false
    });
  }

  /**
   * Creates an object with the same keys as `object` and values generated
   * by running each own enumerable string keyed property of `object` thru
   * `func`.
   * 
   * @param {Object} object The object to iterate over
   * @param {Function} func The function invoked per iteration
   * @returns {Object} Returns the new mapped object
   */
  function mapValues(object, func) {
    let key, result = {};
    for (key in object) {
      if (!object.hasOwnProperty(key)) { continue; }
      result[key] = func.call(object, object[key], key);
    }
    return result;
  }

  function simplify(entity) {
    return {
      id: entity.id,
      labels: simplifyLabels(entity.labels),
      claims: simplifyClaims(entity.claims)
    };
  }

  function simplifyLabels(labels) {
    return mapValues(labels, label => label.value);
  }

  function simplifyClaim(claim) {
    const snak = claim.mainsnak;
    return {
      value_type: snak.datatype,
      value_id: snak.datavalue.value.id,
      value: snak.datavalue.value
    };
  }

  function simplifyClaims(claims) {
    return mapValues(claims, claim => claim.map(simplifyClaim));
  }

  //function getIDs

  function getById(id) {
    let entities = {};

    return get({
      ids: id,
      languages: ['pl', 'en'],
      sitefilter: 'plwiki',
    })
      .then(data => mapValues(data.data.entities, entity => simplify(entity)))
      .then(data => {
        entities = data;
        const simplified = mapValues(data,
          entity => mapValues(entity.claims,
            claim => claim.map(value => value.value_id)));
        let ids = [];
        forOwn(simplified, item => {
          ids.push.apply(ids, Object.keys(item));
          forOwn(item, prop => ids.push.apply(ids, prop));
        });
        ids = ids.filter((item, pos, self) => item && self.indexOf(item) === pos);
        return ids;
      })
      .then(labelsIDs => get({
        ids: labelsIDs,
        props: ['labels']
      }))
      .then(response => mapValues(response.data.entities, entity => simplifyLabels(entity.labels)))
      .then(labels => {
        forOwn(entities, entity => {
          entity.claims = mapValues(entity.claims, (values, key) => ({
            property_id: key,
            property: labels[key],
            values: values.map(value => labels[value.value_id] ?
              angular.extend(value, { value: labels[value.value_id] }) :
              value)
          }));
        });
        return entities;
      });
  }

  return service;
};

export default () => {
  angular
    .module('monumental')
    .factory('wikidata', wdService);
};