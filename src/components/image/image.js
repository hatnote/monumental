import './image.scss';
import imageTemplate from './image.tpl.html';

const ImageService = ($mdDialog, $timeout) => {
  const service = {
    openImage,
  };

  return service;

  //

  function openImage(image, event) {
    return $mdDialog.show({
      parent: angular.element(document.body),
      targetEvent: event,
      clickOutsideToClose: true,
      template: imageTemplate,
      controller: ($scope) => {
        const vm = $scope;

        vm.close = () => $mdDialog.hide();
        vm.image = image;

        vm.author = image.extmetadata.Artist ? image.extmetadata.Artist.value : '';
        vm.date = image.extmetadata.DateTime ? new Date(image.extmetadata.DateTime.value) : '';

        $timeout(() => { vm.loaded = true; }, 150);
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
