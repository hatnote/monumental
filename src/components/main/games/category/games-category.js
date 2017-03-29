import _ from 'lodash';

import './../games.scss';
import template from './games-category.html';

const GamesCategoryComponent = { controller, template };

function controller($mdToast, $q, $state, $stateParams, $window, WikiService, langService, wikidata) {
  const vm = this;
  const id = getId();

  vm.countries = [
    { name: 'France', code: 'Q142' },
    { name: 'Germany', code: 'Q183' },
    { name: 'Great Britain', code: 'Q145' },
    { name: 'Poland', code: 'Q36' },
    { name: 'the United States', code: 'Q30' },
  ];
  vm.country = id;
  vm.isReminderShown = true;
  vm.loading = true;

  vm.reload = () => $state.go($state.current, { country: vm.country }, { reload: true });
  vm.saveCategory = saveCategory;

  const regexes = {
    Q30: /(20[01][0-9] in.*|Churches in .*|National Register of Historic Places in .*|Photographs of|Photographs taken|in Alabama|in Alaska|in Arizona|in Arkansas|in California|in Colorado|in Connecticut|in Delaware|in Florida|in Georgia (U.S. state)|in Hawaii|in Idaho|in Illinois|in Indiana|in Iowa|in Kansas|in Kentucky|in Louisiana|in Maine|in Maryland|in Massachusetts|in Michigan|in Minnesota|in Mississippi|in Missouri|in Montana|in Nebraska|in Nevada|in New Hampshire|in New Jersey|in New Mexico|in New York|in North Carolina|in North Dakota|in Ohio|in Oklahoma|in Oregon|in Pennsylvania|in Rhode Island|in South Carolina|in South Dakota|in Tennessee|in Texas|in Utah|in Vermont|in Virginia|in Washington, D.C.|in West Virginia|in Wisconsin|in Wyoming|in the United States)/gi,
    Q36: /(20[01][0-9] in.*|Cultural heritage monuments in.*|in Greater Poland Voivodeship|in Kuyavian-Pomeranian Voivodeship|in Lesser Poland Voivodeship|in Lower Silesian Voivodeship|in Lublin Voivodeship|in Lubusz Voivodeship|in Łódź Voivodeship|in Masovian Voivodeship|in Opole Voivodeship|in Podlaskie Voivodeship|in Pomeranian Voivodeship|in Silesian Voivodeship|in Subcarpathian Voivodeship|in Świętokrzyskie Voivodeship|in Warmian-Masurian Voivodeship|in West Pomeranian Voivodeship|in Poland)/gi,
    Q145: /(20[01][0-9] in.*|listed [a-z]* in.*|in Bedfordshire|in Berkshire|in Bristol|in Buckinghamshire|in Cambridgeshire|in Cheshire|in Cornwall|in County Durham|in Cumbria|in Derbyshire|in Devon|in Dorset|in East Sussex|in Essex|in Gloucestershire|in Greater Manchester|in Hampshire|in Herefordshire|in Hertfordshire|on the Isle of Wight|in Kent|in Lancashire|in Leicestershire|in Lincolnshire|in London|in Merseyside|in Middlesex|in Norfolk, England|in Northamptonshire|in Northumberland|in Nottinghamshire|in Oxfordshire|in Rutland|in Shropshire|in Somerset|in Staffordshire|in Suffolk|in Surrey|in Tyne and Wear|in Warwickshire|in the West Midlands|in West Sussex|in Wiltshire|in Worcestershire|in North Yorkshire|in South Yorkshire|in the East Riding of Yorkshire|in West Yorkshire|in England|in Scotland|in the United Kingdom)/gi,
  };

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

  function getCategoryEligibility(name) {
    const regex = regexes[vm.country];
    if (!regex) { return true; }

    regex.lastIndex = 0;
    const matches = regex.exec(name.trim());
    return !matches;
  }

  function getCountry() {
    wikidata.get({ ids: id })
      .then((response) => {
        const entry = response.entities[id];
        vm.name = entry.labels.en.value;
      });
  }

  function getId() {
    const param = $stateParams.country;
    if (!param) { return false; }
    if (param.includes('Q')) { return param; }
    return `Q${param}`;
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
    if (!vm.country) { return; }

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
          element.categories = response[element.image.name]
            .map(category => ({
              name: category,
              isEligible: getCategoryEligibility(category),
            }))
            .filter(category => category.isEligible);
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
