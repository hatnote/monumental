import commons from './commons.service';
import theme from './theme.service';
import wikidata from './wikidata.service';

export default () => {
  commons();
  theme();
  wikidata();
};
