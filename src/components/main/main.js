import './main.scss';
import template from './main.html';
import pack from '../../../package.json';

const MainComponent = { controller, template };

function controller() {
  const vm = this;

  if (!Array.prototype.includes) {
    Array.prototype.includes = function (searchElement /*, fromIndex*/) {
      'use strict';
      var O = Object(this);
      var len = parseInt(O.length) || 0;
      if (len === 0) {
        return false;
      }
      var n = parseInt(arguments[1]) || 0;
      var k;
      if (n >= 0) {
        k = n;
      } else {
        k = len + n;
        if (k < 0) { k = 0; }
      }
      var currentElement;
      while (k < len) {
        currentElement = O[k];
        if (searchElement === currentElement ||
          (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
          return true;
        }
        k++;
      }
      return false;
    };
  }

  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
      'use strict';
      if (typeof start !== 'number') {
        start = 0;
      }

      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }
}

export default () => {
  angular
    .module('monumental')
    .component('moMain', MainComponent);
};
