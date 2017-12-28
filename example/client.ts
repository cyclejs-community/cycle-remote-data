import {
  makeRemoteDataDriver,
  RemoteDataSource,
  RemoteResponse,
  NotAsked,
  RemoteData
} from '../src';
import { makeDOMDriver, DOMSource, div, input, button, pre } from '@cycle/dom';
import { timeDriver, TimeSource } from '@cycle/time';
import { run } from '@cycle/run';
import xs from 'xstream';

interface Sources {
  DOM: DOMSource;
  Time: TimeSource;
  RemoteData: RemoteDataSource;
}

interface Result {
  name: string;
  value: string;
}

function GithubSearch(sources: Sources) {
  const query$ = sources.DOM
    .select('.search-query')
    .events('input')
    .map(ev => (ev.target as HTMLInputElement).value)
    .remember();

  const finishedTyping$ = query$.compose(sources.Time.debounce(250));

  const searchClick$ = sources.DOM.select('.search').events('click');

  const reload$ = sources.DOM.select('.reload').events('click');

  const search$ = xs.merge(finishedTyping$, reload$, searchClick$);

  const data$ = search$.map(() => query$.take(1)).flatten();

  const loadingProgress$ = sources.Time.periodic(300).map(i => i % 3 + 1);

  const remoteData$ = data$
    .map(query => {
      if (query === '') {
        return xs.of(NotAsked).remember();
      }

      return sources.RemoteData
        .request({ url: `/?${query}`, method: 'GET' })
        .debug('hi');
    })
    .flatten();

  const post$ = remoteData$
    .map((remoteData: RemoteResponse) =>
      remoteData.rmap(res => res.body as Result[])
    )
    .startWith(NotAsked);

  return {
    DOM: xs.combine(post$, loadingProgress$).map(view)
  };
}

function view([remotePost, loadingProgress]: [RemoteData<Result[]>, number]) {
  return div([
    div('Search github'),
    input('.search-query'),
    button('.search', 'Search'),

    remotePost.when({
      Loading: progress => loadingView(loadingProgress),
      Error: errorView,
      Ok: resultsView,
      NotAsked: notAskedView
    })
  ]);
}

function errorView() {
  return div(['Error loading content', button('.reload', 'Reload')]);
}

function loadingView(progress: number) {
  return div([
    'Loading' +
      Array(progress)
        .fill('.')
        .join('')
  ]);
}

function notAskedView() {
  return div(['Search for something!']);
}

function resultsView(results: Result[]) {
  if (results.length === 0) {
    return div('No results found');
  }

  return div(results.map(post => div('.post', post.name + ' - ' + post.value)));
}

const drivers = {
  DOM: makeDOMDriver(document.body),
  RemoteData: makeRemoteDataDriver(),
  Time: timeDriver
};

run(GithubSearch, drivers);
