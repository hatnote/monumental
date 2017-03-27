import _ from 'lodash';

import './../games.scss';
import template from './games-category.html';

const GamesCategoryComponent = { controller, template };

function controller($mdToast, $q, $state, $stateParams, $window, WikiService, langService, wikidata) {
  const vm = this;
  const id = $stateParams.country.includes('Q') ? $stateParams.country : `Q${$stateParams.country}`;

  vm.countries = [
    { name: 'France', code: 'Q142' },
    { name: 'Germany', code: 'Q183' },
    { name: 'Great Britain', code: 'Q145' },
    { name: 'Poland', code: 'Q36' },
    { name: 'the USA', code: 'Q30' },
  ];
  vm.country = id || 'Q36';
  vm.loading = true;

  vm.reload = () => $state.go($state.current, { country: vm.country }, { reload: true });
  vm.saveCategory = saveCategory;

  init();

  function getCategories(filenames) {
    return WikiService.getFilesCategories(filenames.map(filename => `File:${filename}`))
      .then((response) => {
        const images = {};
        _.values(response).forEach((element) => {
          images[element.title.substring(5)] = element.categories ?
            element.categories.map(category => category.title.substring(9)) :
            false;
        });
        return images;
      });
  }

  function getCountry() {
    wikidata.get({ ids: id })
      .then((response) => {
        const entry = response.entities[id];
        vm.name = entry.labels.en.value;
      });
  }

  function getList() {
    const langs = langService.getNativeLanguages(id);
    if (!langs) { return $q.reject('Provided ID is not a country'); }

    return wikidata.getSPARQL(`SELECT ?item ?itemLabel (SAMPLE(?placeLabel) AS ?placeLabel) (SAMPLE(?adminLabel) AS ?adminLabel) (SAMPLE(?image) AS ?image) 
    WHERE {
      ?item wdt:P17 wd:${id} .
      ?item wdt:P1435 ?monument .
      ?item wdt:P18 ?image .
      OPTIONAL { ?item wdt:P276 ?place . ?place rdfs:label ?placeLabel . FILTER(LANG(?placeLabel) = "${langs[0]}") } .
      OPTIONAL { ?item wdt:P131 ?admin . ?admin rdfs:label ?adminLabel . FILTER(LANG(?adminLabel) = "${langs[0]}") } .
      MINUS { ?item wdt:P373 ?commons } .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "${langs.join(',')}" }
    }
    GROUP BY ?item ?itemLabel`);
  }

  function init() {
    vm.loading = true;
    vm.list = [];

    $window.document.title = 'Monumental';

    getCountry();
    getList()
      .then((response) => {
        const rand = Math.floor(Math.random() * (response.length - 24));
        const data = response.slice(rand, rand + 25);
        vm.total = response.length;
        vm.list = data.map(element => ({
          name: {
            value_id: element.item.value.substring(element.item.value.indexOf('/Q') + 1),
            value: element.itemLabel.value,
          },
          admin: element.adminLabel ? element.adminLabel.value : undefined,
          place: element.placeLabel ? element.placeLabel.value : undefined,
          image: {
            name: decodeURIComponent(element.image.value.replace('http://commons.wikimedia.org/wiki/Special:FilePath/', '')),
            thumburl: `${element.image.value.replace('wiki/Special:FilePath', 'w/index.php?title=Special:Redirect/file')}&width=100`,
          },
        }));
        if (!vm.list.length) { return $q.reject('No entries to display'); }
        return vm.list;
      })
      .then(list => getCategories(list.map(entry => entry.image.name)))
      .then((response) => {
        vm.list.forEach((element) => {
          element.categories = response[element.image.name];
        });
        vm.loading = false;
      })
      .catch((err) => {
        vm.error = err;
        vm.loading = false;
      });
  }

  function saveCategory(item, category) {
    const id = item.name.value_id;
    if (id && category) {
      item.success = item.error = undefined;
      item.loading = category;
      WikiService.addCategory(id, category).then((response) => {
        item.success = category;
        item.loading = false;
      }).catch((err) => {
        item.error = err;
        item.loading = false;
        $mdToast.show($mdToast.simple().textContent(`Error: ${err}`).hideDelay(3000));
      });
    }
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moGameCategory', GamesCategoryComponent);
};
