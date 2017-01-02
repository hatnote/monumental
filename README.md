# Monumental

Reasonator for monuments

## Server

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
python app/server.py
```

Test it out:

 - Login: http://localhost:5000/login
 - A simple Wikidata API query: http://localhost:5000/api?action=query&list=random&rnnamespace=0&rnlimit=10 
 - Get an edit token (with authorization): http://localhost:5000/api?action=query&meta=tokens&use_auth=true

See [here](https://www.wikidata.org/w/api.php) for full Wikidata API docs.

### Licnese

Copyright (c) 2017, Stephen LaPorte

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.

    * Redistributions in binary form must reproduce the above
      copyright notice, this list of conditions and the following
      disclaimer in the documentation and/or other materials provided
      with the distribution.

    * The names of the contributors may not be used to endorse or
      promote products derived from this software without specific
      prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
