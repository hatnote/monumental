import _ from 'lodash';

import './monument.scss';
import template from './monument.html';

import pack from '../../../../package.json';

const MonumentComponent = { controller, template };

function controller($httpParamSerializerJQLike, $anchorScroll, $http, $mdDialog, $mdMenu, $mdToast, $q, $rootScope, $sce, $scope, $state, $stateParams, $timeout, $window, FileUploader, localStorageService, WikiService, imageService, langService, leafletData, mapService, textService, wikidata) {
  const vm = this;
  const icon = mapService.getMapIcon();
  const id = $stateParams.id.includes('Q') ? $stateParams.id : `Q${$stateParams.id}`;
  const langs = langService.getUserLanguages();

  vm.actions = {
    claims: [],
    other: [],
  };
  vm.busy = false;
  vm.edit = { all: false };
  vm.image = [];
  vm.isLoggedIn = false;
  vm.lang = langs[0];
  vm.map = {};
  vm.queue = [];
  vm.stateParams = $stateParams;
  vm.text = null;

  vm.getCommonsLink = getCommonsLink;
  vm.getWikipediaArticle = getWikipediaArticle;
  vm.labelChange = labelChange;
  vm.openArticleList = (menu, event) => menu.open(event);
  vm.openImage = openImage;
  vm.saveAll = saveAll;
  vm.scrollTo = anchor => $anchorScroll(anchor);

  // init

  init();

  // functions

  function getCategoryInfo(category) {
    WikiService.getCategoryInfo(category).then((response) => {
      vm.category = response;
    });
  }

  function getCategoryMembers(category) {
    WikiService.getCategoryMembers(category).then((data) => {
      const promises = data.map(image => WikiService.getImage(image, { iiurlheight: 75 }));
      $q.all(promises).then((response) => {
        vm.images = response.map(image => image.imageinfo);
      });
    });
  }

  function getWikipediaArticle(wiki) {
    vm.showAllArticles = false;
    WikiService.getArticleHeader(wiki.code, wiki.title).then((data) => {
      wiki.article = $sce.trustAsHtml(data);
      vm.article = wiki;
      $timeout(() => {
        const height = document.querySelector('.article__text').offsetHeight;
        vm.isArticleLong = height === 320;
      });
    });
  }

  function getCommonsLink() {
    const name = vm.monument.claims.P373.values[0].value;
    return `//commons.wikimedia.org/wiki/Category:${encodeURIComponent(name)}`;
  }

  function getImage(image) {
    WikiService.getImage(image, { iiurlwidth: 640 })
      .then((response) => {
        vm.image.push(response.imageinfo);
      });
  }

  function getInterwiki() {
    const country = getPropertyValue('P17');
    const countryLanguages = langService.getNativeLanguages(country.id);

    vm.interwiki = {};

    vm.interwiki.all = Object.keys(vm.monument.sitelinks)
      .map(key => vm.monument.sitelinks[key])
      .map(element => ({
        code: element.site.replace('wiki', ''),
        title: element.title,
        link: `//${element.site.replace('wiki', '')}.wikipedia.org/wiki/${element.title}`.replace(' ', '_'),
      }))
      .filter(element => !element.code.includes('quote') && !element.code.includes('commons'));

    vm.interwiki.shown = langs
      .map(lang => lang.code)
      .concat(countryLanguages)
      .filter((element, index, array) => array.indexOf(element) === index)
      .map((lang) => {
        const iw = vm.interwiki.all.find(element => element.code === lang);
        return iw || { code: lang };
      });

    const article = vm.interwiki.shown.filter(iw => iw.title);
    if (article.length) {
      getWikipediaArticle(article[0]);
    }
  }

  function getPropertyValue(prop) {
    if (!vm.monument.claims[prop]) return false;
    const value = vm.monument.claims[prop][0];

    return value.mainsnak.datavalue.value;
  }

  function labelChange(lang) {
    vm.actions.other[0] = {
      promise: setLabel,
      value: lang,
    };
  }

  function saveAll() {
    vm.busy = true;
    const actions = [...vm.actions.claims, ...vm.actions.other];
    let counter = actions.length;

    actions.map(promise => promise.promise(promise.value)
      .then((response) => {
        counter -= 1;
        if (!counter) {
          $state.go($state.current, { id }, { reload: true });
        }
        return response;
      })
      .catch((err) => {
        $mdToast.show($mdToast.simple().textContent(`Error: ${err}`).hideDelay(3000));
        vm.busy = false;
      }));
  }

  function recountQueue() {
    const claims = _.values(vm.monument.claims);
    vm.actions.claims = [];
    claims.forEach((claim) => {
      claim.forEach((value) => {
        if (value.action) {
          vm.actions.claims.push(value.action);
        }
      });
    });
  }

  function init() {
    vm.config = {
      env: $window.__env,
      package: pack,
    };

    WikiService.getUserInfo().then((response) => {
      vm.isLoggedIn = response;
    });

    const queueListener = $rootScope.$on('recountQueue', () => recountQueue());
    $scope.$on('$destroy', () => queueListener());

    vm.loading = true;

    textService.getText().then((data) => {
      vm.text = data;
    });

    wikidata.getById(id).then((data) => {
      vm.monument = data;

      // image
      if (getPropertyValue('P18')) {
        const image = getPropertyValue('P18');
        getImage(image);
      }
      // commons category
      if (getPropertyValue('P373')) {
        const category = getPropertyValue('P373');
        getCategoryInfo(category);
        getCategoryMembers(category);
      }

      getInterwiki();

      // coordinates
      if (getPropertyValue('P625')) {
        const value = getPropertyValue('P625');
        vm.map = mapService.getMapInstance({
          center: {
            lat: value.latitude,
            lng: value.longitude,
            zoom: 16,
          },
        });
        vm.map.markers = {
          marker: {
            lat: value.latitude,
            lng: value.longitude,
            icon,
          },
        };
        leafletData.getMap().then((map) => {
          map.scrollWheelZoom.disable();
          map.once('focus', () => { map.scrollWheelZoom.enable(); });
        });
      }
      vm.loading = false;

      const title = vm.monument.labels[vm.lang.code] || vm.monument.labels.en;
      $window.document.title = `${title ? title.value : vm.monument.id} – Monumental`;
    });
  }

  function openImage(image, event) {
    imageService.openImage({
      image,
      event,
      list: vm.images,
    });
  }

  function setLabel(lang) {
    return WikiService.setLabel(id, lang, vm.monument.labels[lang].newValue);
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moMonument', MonumentComponent)
    .directive('loadSrc', () => ({
      link: (scope, element, attrs) => {
        let img = null;
        const loadImage = () => {
          element[0].src = '//upload.wikimedia.org/wikipedia/commons/f/f8/Ajax-loader%282%29.gif';
          img = new Image();
          img.src = attrs.loadSrc;
          img.onload = () => { element[0].src = attrs.loadSrc; };
        };
        scope.$watch(() => attrs.loadSrc, (newVal, oldVal) => {
          if (oldVal !== newVal) { loadImage(); }
        });
        loadImage();
      },
    }))
    .directive('ngThumb', ['$window', function ($window) {
      var helper = {
        support: !!($window.FileReader && $window.CanvasRenderingContext2D),
        isFile: function (item) {
          return angular.isObject(item) && item instanceof $window.File;
        },
        isImage: function (file) {
          var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
          return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
      };

      return {
        restrict: 'A',
        template: '<canvas/>',
        link: function (scope, element, attributes) {
          if (!helper.support) return;

          var params = scope.$eval(attributes.ngThumb);

          if (!helper.isFile(params.file)) return;
          if (!helper.isImage(params.file)) return;

          var canvas = element.find('canvas');
          var reader = new FileReader();

          reader.onload = onLoadFile;
          reader.readAsDataURL(params.file);

          function onLoadFile(event) {
            var img = new Image();
            img.onload = onLoadImage;
            img.src = event.target.result;
          }

          function onLoadImage() {
            var width = params.width || this.width / this.height * params.height;
            var height = params.height || this.height / this.width * params.width;
            canvas.attr({ width: width, height: height });
            canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
          }
        }
      };
    }]);
};
