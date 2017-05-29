const wdService = function ($http, $q, langService) {
  const service = {
    get,
    getById,
    getLabels,
    getRecursive,
    getSearch,
    getSPARQL,
  };

  const defaultParams = {
    action: 'wbgetentities',
    format: 'json',
    props: ['info', 'labels', 'aliases', 'descriptions', 'claims', 'datatype', 'sitelinks'],
    languages: langService.getUserLanguages().map(lang => lang.code),
    callback: 'JSON_CALLBACK',
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
    const params = angular.extend({}, defaultParams, data);
    return $http.jsonp('https://www.wikidata.org/w/api.php', {
      params: mapValues(params, p => angular.isArray(p) ? p.join('|') : p),
      cache: false,
    }).then(response => response.data);
  }

  function getLabels(ids) {
    const promises = [];
    for (let i = 0; i < Math.ceil(ids.length / 50); i += 1) {
      promises.push(get({
        ids: ids.slice(i * 50, ((i + 1) * 50) - 1),
        props: ['labels'],
      }));
    }
    return $q.all(promises).then((responses) => {
      const result = {};
      responses.forEach((response) => {
        const values = mapValues(response.entities, entity => simplifyLabels(entity.labels));
        angular.extend(result, values);
      });
      return result;
    });
  }

  function getRecursive(element, recursiveProperty) {
    const query = `SELECT ?parent ?parentLabel WHERE {
        wd:${element} ${recursiveProperty}* ?parent .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "${defaultParams.languages.join(', ')}" }
      }`;
    return getSPARQL(query).then(data => data.map((element) => ({
      link: element.parent.value.replace('entity', 'wiki'),
      value_id: element.parent.value.substring(element.parent.value.indexOf('/Q') + 1),
      value: element.parentLabel.value,
    })));
  }

  function getSearch(text) {
    return get({
      action: 'wbsearchentities',
      search: text,
      type: 'item',
      language: defaultParams.languages[0],
      uselang: defaultParams.languages[0],
    }).then(response => response.search);
  }

  function getSPARQL(query, params) {
    return $http.get('https://query.wikidata.org/sparql', angular.extend({}, {
      params: { query: query.replace(/ {2,}/g, ' ') },
      cache: false,
    }, params)).then(data => data.data.results.bindings);
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
      interwiki: entity.sitelinks,
    };
  }

  function simplifyLabels(labels) {
    return mapValues(labels, label => label.value);
  }

  function simplifyClaim(claim) {
    const snak = claim.mainsnak;
    return {
      value_type: snak.datatype,
      value_id: snak.snaktype === 'novalue' || snak.snaktype === 'somevalue' ? false : snak.datavalue.value.id,
      value: snak.snaktype === 'novalue' || snak.snaktype === 'somevalue' ? false : snak.datavalue.value,
      qualifiers: claim.qualifiers,
      rank: claim.rank,
    };
  }

  function simplifyClaims(claims) {
    return mapValues(claims, claim => claim.map(simplifyClaim));
  }

  // function getIDs

  function getById(id) {
    let entities = {};

    return get({
      ids: id,
      languages: undefined,
    })
      .then(response => mapValues(response.entities, entity => simplifyEntity(entity)))
      .then((data) => {
        entities = data;
        const simplified = mapValues(data,
          entity => mapValues(entity.claims,
            claim => claim.map(value => value.value_id)));
        let ids = [];
        forOwn(simplified, (item) => {
          ids.push.apply(ids, Object.keys(item));
          forOwn(item, prop => ids.push.apply(ids, prop));
        });
        ids = ids.filter((item, pos, self) => item && self.indexOf(item) === pos);
        return ids;
      })
      .then(labelsIDs => getLabels(labelsIDs))
      .then((labels) => {
        forOwn(entities, (entity) => {
          entity.claims = mapValues(entity.claims, (values, key) => ({
            property_id: key,
            property: labels[key],
            values: values.map(value => labels[value.value_id] ?
              angular.extend(value, { value: labels[value.value_id] }) :
              value),
            qualifiers: entity.qualifiers,
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
