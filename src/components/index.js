import main from './main/main';
import dashboard from './main/dashboard/dashboard';
import list from './main/list/list';
import map from './main/map/map';

import monument from './main/monument/monument';
import location from './main/monument/components/location';
import nativeName from './main/monument/components/native-name';
import url from './main/monument/components/url';

import toolbar from './toolbar/toolbar';

import category from './main/games/category/games-category';

export default () => {
  main();
  dashboard();
  list();
  map();

  monument();
  location();
  nativeName();
  url();

  toolbar();

  category();
};
