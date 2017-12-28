import {makeRemoteDataDriver, NotAsked} from '../src';
import {makeDOMDriver, div, input, button} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {run} from '@cycle/run';
import xs from 'xstream';

function GithubSearch(sources) {
  const query$ = sources.DOM
    .select('.search')
    .events('input')
    .map(ev => ev.target.value)
    .remember();

  const reload$ = sources.DOM
    .select('.reload')
    .events('click');

  const search$ = xs.merge(
    query$.compose(sources.Time.debounce(250)),
    reload$
  );

  const searchWithQuery$ = search$.map(() => query$.take(1)).flatten();

  const post$ = searchWithQuery$
    .map(query =>
      query === ''
        ? NotAsked
        : sources.RemoteData.request({
            url: `https://api.github.com/search/repositories?q=${query}`,
            method: 'GET'
          })
    )
    .flatten()
    .map(remoteData => remoteData.rmap(response => response.body))
    .startWith(NotAsked);

  return {
    DOM: post$.map(view)
  }
}

function view(remotePost) {
  return div([
    'Search github',
    input('.search'),

    remotePost.when({
      Loading: loadingView,
      Error: errorView,
      Ok: postsView,
      NotAsked: notAskedView
    })
  ]);
}

function errorView() {
  return div([
    'Error loading content',
    button('.reload', "Reload")
  ])
}

function loadingView() {
  return div('Loading...')
}

function notAskedView() {
  return div([
    'Search for something!'
  ])
}

function postsView(posts) {
  return div([
    JSON.stringify(posts)
  ])
}

const drivers = {
  DOM: makeDOMDriver(document.body),
  RemoteData: makeRemoteDataDriver(),
  Time: timeDriver
}

run(GithubSearch, drivers);
