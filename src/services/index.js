import lang from './lang.service';
import map from './map.service';
import theme from './theme.service';
import wiki from './wiki.service';
import wikidata from './wikidata.service';
import text from './text.service';


export default () => {
  lang();
  map();
  theme();
  wiki();
  wikidata();
  text();
};
