import {makeRemoteDataDriver, NotAsked} from '../src';
import {makeDOMDriver, div, input, button, pre} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {run} from '@cycle/run';
import xs from 'xstream';

function GithubSearch(sources) {
  const query$ = sources.DOM
    .select('.search')
    .events('input')
    .map(ev => ev.target.value)
    .remember();

  const finishedTyping$ = query$
    .compose(sources.Time.debounce(250));

  const reload$ = sources.DOM.select('.reload').events('click');

  const data$ = xs.merge(
    finishedTyping$,
    reload$
  ).map(() => query$.take(1)).flatten()

  const post$ = data$
    .map(q => {
      if (q === '') { return xs.of(NotAsked) };

      return sources.RemoteData.get('/?' + q);
    })
    .flatten()
    .map(remoteData => remoteData.rmap(res => res.body))
    .startWith(NotAsked);

  return {
    DOM: post$.map(view)
  }
}

function view(remotePost) {
  return div([
    'Search github',
    input('.search'),

    remotePost.match({
      Loading: loadingView,
      Error: errorView,
      Ok: postsView,
      NotAsked: notAskedView
    })
  ])
}

function errorView() {
  return div([
    'Error loading content',
    button('.reload', "Reload")
  ])
}

function loadingView() {
  return div([
    'Loading...'
  ])
}

function notAskedView() {
  return div([
    'Search for something!'
  ])
}

function postsView(posts) {
  if (posts.length === 0) {
    return div('No results found');
  }

  return div(posts.map(post => div('.post', post.name + ' - ' + post.value)));
}

const drivers = {
  DOM: makeDOMDriver(document.body),
  RemoteData: makeRemoteDataDriver(),
  Time: timeDriver
}

run(GithubSearch, drivers);
