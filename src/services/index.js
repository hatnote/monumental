import theme from './theme.service';
import wiki from './wiki.service';
import wikidata from './wikidata.service';

export default () => {
  theme();
  wiki();
  wikidata();
};
