const wdService = function ($http, $q) {

  const service = {
    getById: getById,
    getLabels: getLabels,
    getRecursive: getRecursive,
    getSearch: getSearch,
    getSPARQL: getSPARQL,
    setLanguages: setLanguages
  };

  const defaultParams = {
    action: 'wbgetentities',
    format: 'json',
    props: ['info', 'labels', 'aliases', 'descriptions', 'claims', 'datatype', 'sitelinks'],
    languages: ['en'],
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
    let params = angular.extend({}, defaultParams, data);
    return $http.jsonp('https://www.wikidata.org/w/api.php', {
      params: mapValues(params, p => angular.isArray(p) ? p.join('|') : p),
      cache: false
    });
  }

  function getLabels(ids) {
    return get({
      ids: ids,
      props: ['labels']
    }).then(response => mapValues(response.data.entities, entity => simplifyLabels(entity.labels)));
  }

  function getRecursive(element, recursiveProperty) {
    let query = `SELECT ?parent ?parentLabel WHERE {
        wd:`+ element + ` wdt:` + recursiveProperty + `* ?parent .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "` + defaultParams.languages.join(', ') + `" }
      }`;
    return getSPARQL(query).then(data => {
      return data.map(element => ({
        link: element.parent.value.replace('entity', 'wiki'),
        value_id: element.parent.value.substring(element.parent.value.indexOf('/Q') + 1),
        value: element.parentLabel.value
      }));
    });
  }

  function getSearch(text) {
    return get({
      action: 'wbsearchentities',
      search: text,
      type: 'item',
      language: defaultParams.languages[0]
    }).then(data => data.data.search);
  }

  function getSPARQL(query) {
    return $http.get('https://query.wikidata.org/sparql', {
      params: { query: query },
      cache: false
    }).then(data => data.data.results.bindings);
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

  function setLanguages(languages) {
    defaultParams.languages = languages;
  }

  function simplifyAliases(aliases) {
    return mapValues(aliases, lang => lang.map(alias => alias.value));
  }

  function simplifyEntity(entity) {
    return {
      _raw: entity,
      id: entity.id,
      labels: simplifyLabels(entity.labels),
      aliases: simplifyAliases(entity.aliases),
      descriptions: simplifyLabels(entity.descriptions),
      claims: simplifyClaims(entity.claims),
      interwiki: entity.sitelinks
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
      value: snak.datavalue.value,
      qualifiers: claim.qualifiers
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
      languages: defaultParams.languages
    })
      .then(data => mapValues(data.data.entities, entity => simplifyEntity(entity)))
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
      .then(labelsIDs => getLabels(labelsIDs))
      .then(labels => {
        forOwn(entities, entity => {
          entity.claims = mapValues(entity.claims, (values, key) => ({
            property_id: key,
            property: labels[key],
            values: values.map(value => labels[value.value_id] ?
              angular.extend(value, { value: labels[value.value_id] }) :
              value),
            qualifiers: entity.qualifiers
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