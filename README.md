# cycle-remote-data

> USAGE: common-readme [-r|--repo REPO-NAME] [-l|--license LICENSE]

`cycle-remote-data` is a library for requesting data from servers. Have you ever found with `@cycle/http` that you forget to handle errors or to show a loading message?

With `cycle-remote-data`, you can call `sources.RemoteData.get(url, options)`, which returns a `MemoryStream` of `RemoteData` objects.

There are four possible states: Loading, Error, Ok and NotAsked. When working with `RemoteData` objects, we match over these possibilities.

If you're using TypeScript, in strict mode you will be forced to handle all cases, which is worthwhile if you don't want runtime errors.

E.g.

```js
const data$ = sources.RemoteData.get('https://github.com/search?q=cycle');

data$.map(remoteData =>
  remoteData.match({
    NotAsked: () => 'Request some data!',
    Loading: () => 'Loading...',
    Error: (err) => 'An error occurred while loading the data.',
    Ok: (response) => 'Result: ' + response.body
  })
)
```

As the request loads and succeeds or fails, new RemoteData objects representing the current state will be emitted.

## Usage

```js
import {makeRemoteDataDriver, NotAsked} from 'cycle-remote-data';
import {makeDOMDriver} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {run} from '@cycle/run';

function GithubSearch(sources) {
  const search$ = sources.DOM
    .select('.search')
    .events('input')
    .compose(Time.debounce(250));

  const post$ = search$
    .map(q => sources.RemoteData.get('/posts', {q}))
    .flatten()
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
  return div('Loading...')
}

function notAskedView() {
  return div([
    'Search for something!'
  ])
}

function postsView(posts) {
  return div([
    //...
  ])
}
```

outputs

```
hello warld
```

## API

```js
var cycleRemoteData = require('cycle-remote-data')
```

See [api_formatting.md](api_formatting.md) for tips.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install cycle-remote-data
```

## Acknowledgments

cycle-remote-data was inspired by..

## See Also

- [`noffle/common-readme`](https://github.com/noffle/common-readme)
- ...

## License

MIT

