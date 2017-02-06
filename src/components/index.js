import main from './main/main';
import dashboard from './main/dashboard/dashboard';
import list from './main/list/list';
import map from './main/map/map';
import monument from './main/monument/monument';

export default () => {
  main();
  dashboard();
  list();
  map();
  monument();
};
