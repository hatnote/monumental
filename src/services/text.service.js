const TextService = ($q, wikidata) => {
  const service = {
    getText,
  };
  let texts = null;

  return service;

  function getPropertiesLabels() {
    const ids = [
      'P17',
      'P31',
      'P276',
      'P6375',
      'P159',
      'P361',
      'P463',
      'P669',
      'P276',
      'P625',
      'P571',
      'P793',
      'P2048',
      'P2046',
      'P1101',
      'P1139',
      'P1301',
      'P84',
      'P287',
      'P631',
      'P193',
      'P1028',
      'P127',
      'P361',
      'P527',
      'P580',
      'P582',
      'P585',
      'P805',
      'P518',
      'P670',
      'P1037',
      'P1174',
      'P1436',
      'P112',
      'P1706', // qualifiers
      'Q11573',
      'Q25343',
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
  angular.module('monumental').factory('textService', TextService);
};
