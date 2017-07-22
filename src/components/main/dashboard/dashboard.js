import './dashboard.scss';
import template from './dashboard.html';

import pack from '../../../../package.json';

const DashboardComponent = { controller, template };

function controller($filter, $mdToast, $state, $window, WikiService, langService) {
  const vm = this;
  vm.lang = {};
  vm.languagesList = langService.getLanguagesList();
  vm.languages = langService.getUserLanguages();
  vm.loading = false;
  vm.saveUserLanguages = saveUserLanguages;
  vm.searchLang = text => $filter('filter')(vm.languagesList, text);
  vm.setLanguage = (lang) => { vm.languages.push(lang.code); };

  init();

  function init() {
    $window.document.title = 'Dashboard – Monumental';

    vm.config = {
      env: $window.__env,
      package: pack,
    };

    vm.examples = [
      {
        name: 'Empire State Building',
        id: 9188,
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Empire_State_Building_from_the_Top_of_the_Rock.jpg/640px-Empire_State_Building_from_the_Top_of_the_Rock.jpg',
        credit: 'Jiuguang Wang / CC BY-SA 2.0',
      },
      {
        name: 'Katedra Wawelska',
        id: 638519,
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/292_Krakow_Katedra_na_Wawelu_20070805.jpg/640px-292_Krakow_Katedra_na_Wawelu_20070805.jpg',
        credit: 'Jakub Hałun / CC BY-SA 3.0',
      },
      {
        name: 'Church of the Holy Sepulchre',
        id: 187702,
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/The_Church_of_the_Holy_Sepulchre-Jerusalem.JPG/640px-The_Church_of_the_Holy_Sepulchre-Jerusalem.JPG',
        credit: '@jlascar/flickr / CC BY 2.0',
      },
      {
        name: 'Buckingham Palace',
        id: 42182,
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Buckingham_Palace%2C_London_-_April_2009.jpg/640px-Buckingham_Palace%2C_London_-_April_2009.jpg',
        credit: 'Diliff / CC BY-SA 3.0',
      },
      {
        name: 'Sydney Opera House',
        id: 45178,
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sydney_Opera_House_Sails.jpg/640px-Sydney_Opera_House_Sails.jpg',
        credit: 'Enochlau / CC BY-SA 3.0',
      },
      {
        name: 'Lincoln Memorial',
        id: 213559,
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Aerial_view_of_Lincoln_Memorial_-_east_side_EDIT.jpeg/640px-Aerial_view_of_Lincoln_Memorial_-_east_side_EDIT.jpeg',
        credit: 'Carol M. Highsmith / upstateNYer / PD',
      },
      {
        name: 'Brandenburger Tor',
        id: 82425,
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Brandenburg_Gate_%288331820462%29.jpg/640px-Brandenburg_Gate_%288331820462%29.jpg',
        credit: 'Steve Collis / CC BY 2.0',
      },
      {
        name: 'Pałac Kultury i Nauki',
        id: 167566,
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/PKiN_widziany_z_WFC.jpg/640px-PKiN_widziany_z_WFC.jpg',
        credit: 'Nnb / GFDL',
      },
      {
        name: 'Tour Eiffel',
        id: 243,
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/640px-Tour_Eiffel_Wikimedia_Commons.jpg',
        credit: 'Benh LIEU SONG / CC BY-SA 3.0',
      },
      {
        name: 'Duomo di Milano',
        id: 18068,
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/876MilanoDuomo.JPG/640px-876MilanoDuomo.JPG',
        credit: 'MarkusMark / CC BY-SA 3.0',
      },
    ];
  }

  function saveUserLanguages() {
    langService.setUserLanguages(vm.languages)
      .then(() => {
        $mdToast.show($mdToast.simple().textContent('Languages saved!').hideDelay(3000));
        $state.reload();
      });
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moDashboard', DashboardComponent);
};
