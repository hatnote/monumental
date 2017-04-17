import './image.scss';
import imageTemplate from './image.tpl.html';

const ImageService = ($mdDialog, $timeout) => {
  const service = {
    openImage,
  };

  return service;

  //

  function openImage(params) {
    return $mdDialog.show({
      parent: angular.element(document.body),
      targetEvent: params.event,
      clickOutsideToClose: true,
      template: imageTemplate,
      controller: ($scope) => {
        const list = params.list;
        const vm = $scope;

        vm.close = () => $mdDialog.hide();
        vm.image = params.image;
        vm.keyDown = keyDown;
        vm.nextImage = nextImage;
        vm.prevImage = prevImage;

        init();
        $timeout(() => { vm.loaded = true; }, 150);

        function init() {
          vm.author = vm.image.extmetadata.Artist ? vm.image.extmetadata.Artist.value : '';
          vm.date = vm.image.extmetadata.DateTime ? new Date(vm.image.extmetadata.DateTime.value) : '';
          vm.description = vm.image.extmetadata.ImageDescription ? vm.image.extmetadata.ImageDescription.value : '';
          vm.license = vm.image.extmetadata.LicenseShortName ? vm.image.extmetadata.LicenseShortName.value : '';
        }

        function keyDown(key) {
          if (key.keyCode === 39) { nextImage(); }
          if (key.keyCode === 37) { prevImage(); }
        }

        function nextImage() {
          let currentIndex = list.indexOf(vm.image);
          if (currentIndex > -1) {
            currentIndex = currentIndex + 1 === list.length ? 0 : currentIndex + 1;
            vm.image = list[currentIndex];
            init();
          }
        }

        function prevImage() {
          let currentIndex = list.indexOf(vm.image);
          if (currentIndex > -1) {
            currentIndex = currentIndex ? currentIndex - 1 : list.length - 1;
            vm.image = list[currentIndex];
            init();
          } 
        }
      },
    });
  }
};

export default () => {
  angular
    .module('monumental')
    .factory('imageService', ImageService)
    .filter('htmlToPlaintext', () => text => angular.element(`<div>${text}</div>`).text());
};
