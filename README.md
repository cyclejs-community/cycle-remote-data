# cycle-remote-data

> USAGE: common-readme [-r|--repo REPO-NAME] [-l|--license LICENSE]

background details relevant to understanding what this module does

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
  return div([
    'Error loading content',
    button('.reload', "Reload")
  ])
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

