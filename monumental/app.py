# -*- coding: utf-8 -*-

import os
import json
import urllib2

from urllib import urlencode

import yaml
import clastic
import requests

from clastic import Application, redirect, StaticFileRoute, MetaApplication
from clastic.static import StaticApplication
from clastic.render import render_basic
from clastic.middleware.cookie import SignedCookieMiddleware, NEVER

from mwoauth import Handshaker, RequestToken, ConsumerToken
from requests_oauthlib import OAuth1


DEFAULT_WIKI_API_URL = 'https://commons.wikimedia.org/w/api.php'
COMMONS_WIKI_API_URL = 'https://commons.wikimedia.org/w/api.php'
WIKIDATA_API_URL = 'https://www.wikidata.org/w/api.php'
TEST_WIKI_API_URL = 'https://test.wikipedia.org/w/api.php'
WIKI_OAUTH_URL = 'https://commons.wikimedia.org/w/index.php'
PROJ_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_PATH = os.path.join(PROJ_PATH, 'static')

def home(cookie, request):
    headers = dict([(k, v) for k, v in
                    request.environ.items() if k.startswith('HTTP_')])

    return {'cookies': dict(cookie),  # For debugging
            'headers': headers}


def login(request, consumer_token, cookie, root_path):
    handshaker = Handshaker(WIKI_OAUTH_URL, consumer_token)

    redirect_url, request_token = handshaker.initiate()

    cookie['request_token_key'] = request_token.key
    cookie['request_token_secret'] = request_token.secret

    cookie['return_to_url'] = request.args.get('next', root_path)

    return redirect(redirect_url)


def logout(request, cookie, root_path):
    cookie.pop('userid', None)
    cookie.pop('username', None)
    cookie.pop('oauth_access_key', None)
    cookie.pop('oauth_access_secret', None)
    cookie.pop('request_token_secret', None)
    cookie.pop('request_token_key', None)

    return_to_url = request.args.get('next', root_path)

    return redirect(return_to_url)


def complete_login(request, consumer_token, cookie):
    handshaker = Handshaker(WIKI_OAUTH_URL, consumer_token)

    req_token = RequestToken(cookie['request_token_key'],
                             cookie['request_token_secret'])

    access_token = handshaker.complete(req_token,
                                       request.query_string)

    identity = handshaker.identify(access_token)

    userid = identity['sub']
    username = identity['username']

    cookie['userid'] = userid
    cookie['username'] = username
    # Is this OK to put in a cookie?
    cookie['oauth_access_key'] = access_token.key
    cookie['oauth_access_secret'] = access_token.secret

    return_to_url = cookie.get('return_to_url', '/')

    return redirect(return_to_url)


def get_wd_token(request, cookie, consumer_token, token_type=None,
                 api_url=DEFAULT_WIKI_API_URL):
    params = {'action': 'query',
              'meta': 'tokens',
              'format': 'json'}

    auth = OAuth1(consumer_token.key,
                  client_secret=consumer_token.secret,
                  resource_owner_key=cookie['oauth_access_key'],
                  resource_owner_secret=cookie['oauth_access_secret'])

    if token_type:
        # by default, gets a csrf token (for editing)
        params['type'] = token_type
    else:
        params['type'] = 'csrf'

    raw_resp = requests.get(api_url,
                            params=params,
                            auth=auth)

    resp = raw_resp.json()
    token_name = params['type'] + 'token'
    token = resp['query']['tokens'][token_name]

    return token


def send_to_commons_api(request, cookie, consumer_token):
    return send_to_wiki_api(request, cookie, consumer_token, api_url=COMMONS_WIKI_API_URL)

def send_to_wikidata_api(request, cookie, consumer_token):
    return send_to_wiki_api(request, cookie, consumer_token, api_url=WIKIDATA_API_URL)

def send_to_test_api(request, cookie, consumer_token):
    return send_to_wiki_api(request, cookie, consumer_token, api_url=TEST_WIKI_API_URL)


def send_to_wiki_api(request, cookie, consumer_token, api_url=DEFAULT_WIKI_API_URL):
    """Sends GET or POST variables to the Wikidata API at
    http://wikidata.org/w/api.php.

    Add ?use_auth=true for actions that require logging in and an edit
    token.
    """

    auth = False
    api_args = {k: v for k, v in request.values.items()}

    if api_args.get('use_auth'):

        if not cookie.get('oauth_access_key'):
            resp_dict = {'status': 'exception',
                         'exception': 'not logged in'}
            return resp_dict

        api_args.pop('use_auth')
        token = get_wd_token(request, cookie, consumer_token, api_url=api_url)
        api_args['token'] = token
        auth = OAuth1(consumer_token.key,
                      client_secret=consumer_token.secret,
                      resource_owner_key=cookie['oauth_access_key'],
                      resource_owner_secret=cookie['oauth_access_secret'])

    if not api_args.get('format'):
        api_args['format'] = 'json'

    method = request.method

    if method == 'GET':
        resp = requests.get(api_url, api_args, auth=auth)
    elif method == 'POST':
        resp = requests.post(api_url, api_args, auth=auth, files=request.files)

    try:
        resp_dict = resp.json()
    except ValueError:
        # For debugging
        resp_dict = {'status': 'exception',
                     'exception': resp.text,
                     'api_args': api_args}
    return resp_dict


def create_app():
    static_app = StaticApplication(STATIC_PATH)

    def fe_app_route(path, ignore_trailing=True):
        # added to support the removal of the '#' in Angular URLs
        target = STATIC_PATH + '/index.html'
        if ignore_trailing:
            path = path + '/<_ignored*>'
        return StaticFileRoute(path, target)

    routes = [fe_app_route('/', ignore_trailing=False),  # TODO: necessary?
              ('/', static_app),
              ('/home', home, render_basic),
              ('/login', login),
              ('/logout', logout),
              ('/complete_login', complete_login),
              ('/api', send_to_wiki_api, render_basic),
              ('/commons', send_to_commons_api, render_basic),
              ('/wikidata', send_to_wikidata_api, render_basic),
              ('/test', send_to_test_api, render_basic),
              ('/meta', MetaApplication()),
              fe_app_route('/list'),
              fe_app_route('/map'),
              fe_app_route('/object'),
              fe_app_route('/games'),
              fe_app_route('/ireland'),
    ]

    config_file_name = 'config.hatnote.yaml'
    config_file_path = os.path.join(PROJ_PATH, config_file_name)

    config = yaml.load(open(config_file_path))

    cookie_secret = config['cookie_secret']

    root_path = config.get('root_path', '/')

    scm_mw = SignedCookieMiddleware(secret_key=cookie_secret,
                                    path=root_path)
    scm_mw.data_expiry = NEVER

    consumer_token = ConsumerToken(config['oauth_consumer_token'],
                                   config['oauth_secret_token'])

    resources = {'config': config,
                 'consumer_token': consumer_token,
                 'root_path': root_path}

    app = Application(routes, resources, middlewares=[scm_mw])

    return app


app = create_app()


if __name__ == '__main__':
    app.serve()
