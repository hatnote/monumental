A small python server providing authorization for edit actions on Wikidata.

### Local setup

1. Install python requirements

```bash
pip install -r requirements.txt
```

2. Setup config.yaml

Copy config.default.yaml to config.local.yaml. You may need to add oauth consumer info, which you can apply for [here](https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose). If you need a set of keys for testing purposes (running on localhost:5000), you can email me at <stephen.laporte@gmail.com>.

3. Run the dev server

```bash
python monumental/server.py
```

Test it out:

 - Login: http://localhost:5000/login
 - A simple Wikidata API query: http://localhost:5000/api?action=query&list=random&rnnamespace=0&rnlimit=10 
 - Get an edit token (with authorization): http://localhost:5000/api?action=query&meta=tokens&use_auth=true

See [here](https://www.wikidata.org/w/api.php) for full Wikidata API docs.
