const TextService = ($q, wikidata) => {
  const service = {
    getText,
  };
  let texts = null;

  return service;

  function getPropertiesLabels() {
    const ids = [
      'P31', 'P366', 'P186', 'P149',
      'P669', 'P276', 'P625',
      'P2048', 'P2046', 'P1101', 'P1139', 'P1301',
      'P84', 'P287', 'P631', 'P193', 'P1028', 'P127',
      'P580', 'P582',
    ];
    return wikidata.getLabels(ids).then((data) => {
      texts = data;
      return texts;
    });
  }

  function getText() {
    return texts ? $q.when(texts) : getPropertiesLabels();
  }
};

export default () => {
  angular
    .module('monumental')
    .factory('textService', TextService);
};
