import _ from 'lodash';

import './../games.scss';
import template from './games-category.html';

const GamesCategoryComponent = { controller, template };

function controller($state, $window, WikiService, wikidata) {
  const vm = this;
  vm.loading = true;

  vm.hideItem = hideItem;
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

  function getList() {
    return wikidata.getSPARQL(`SELECT ?item ?itemLabel (SAMPLE(?image) AS ?image)
    WHERE {
      ?item wdt:P17 wd:Q36 .
      ?item wdt:P1435 ?monument .
      ?item wdt:P18 ?image .
      MINUS { ?item wdt:P373 ?commons } .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "pl" }
    }
    GROUP BY ?item ?itemLabel`);
  }

  function hideItem(item) {
    vm.list = vm.list.filter(element => element.name.value_id !== item.name.value_id);
    if (!vm.list.length) { init(); }
  }

  function init() {
    vm.loading = true;
    getList().then((data) => {
      console.log(data.length);
      const rand = Math.floor(Math.random() * (data.length - 24));
      console.log(rand);
      data = data.slice(rand, rand + 25);
      vm.list = data.map(element => ({
        name: {
          value_id: element.item.value.substring(element.item.value.indexOf('/Q') + 1),
          value: element.itemLabel.value,
        },
        filename: decodeURIComponent(element.image.value.replace('http://commons.wikimedia.org/wiki/Special:FilePath/', '')),
        image: element.image ? `${element.image.value.replace('wiki/Special:FilePath', 'w/index.php?title=Special:Redirect/file')}&width=120` : false,
      }));
      return vm.list;
    })
    .then(list => getCategories(list.map(entry => entry.filename)))
    .then((response) => {
      vm.list.forEach((element) => {
        element.categories = response[element.filename];
      });
      vm.loading = false;
    });
  }

  function saveCategory(item, category) {
    if (item.name.value_id && category) {
      item.loading = category;
      WikiService.setClaim({
        action: 'wbcreateclaim',
        format: 'json',
        entity: `${item.name.value_id}`,
        property: 'P373',
        snaktype: 'value',
        summary: '#monumental',
        value: `"${category}"`,
      }).then((response) => {
        hideItem(item);
      }).catch((err) => {
        item.loading = false;
      });
    }
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moGameCategory', GamesCategoryComponent);
};
