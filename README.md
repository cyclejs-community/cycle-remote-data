# cycle-remote-data

`cycle-remote-data` is a Cycle.js driver for fetching and sending data over HTTP.

`@cycle/http` is the official HTTP driver for Cycle.js. `cycle-remote-data` attempts to improve over `@cycle/http` in a number of ways. When using `@cycle/http`, it is easy to forget to handle errors, which then crash your application. Successfully handling errors is not easy, and if you are using a type checker can be extra painful.

Additionally, it is often useful to be able to show feedback in the UI when loading data, or when data loading has not yet started. This is also not always straightforward with `@cycle/http`.

With `cycle-remote-data`, you can call `sources.RemoteData.request({url: '/search?q=hi', method: 'GET')`, which returns a `MemoryStream` of `RemoteData` objects.

There are four possible states: Loading, Error, Ok and NotAsked. When working with `RemoteData` objects, we handle all of these possibilities.

When using TypeScript in strict mode, the compiler will even catch any cases we fail to handle!

Usage
---
First, we want to import `makeRemoteDataDriver` and add it to our drivers.

```ts
import { makeRemoteDataDriver } from 'cycle-remote-data';

const drivers = {
  DOM: makeDOMDriver('.app'),
  RemoteData: makeRemoteDataDriver()
}
```

Then, inside of our main, we can use `sources.RemoteData.request` to make requests.

```ts
function main(sources) {
  const results$ = sources.RemoteData.request({
    method: 'GET',
    url: 'https://api.github.com/search/repositories?q=cycle'
  });
}
```

If you've used `@cycle/http`, you'll notice some differences. First of all, we can make requests with a method in sources, rather than from our sinks. Secondly, instead of a stream of streams, we're just working with a flat stream of RemoteData states.

One nice similarity is that `cycle-remote-data` expects requests in the same format as `@cycle/http`, and uses the exact same code under the hood to turn that into a `superagent` request.

So we have a stream of `RemoteData` states, but what is a `RemoteData`? If we print it out, we see an object with two methods, `when` and `rmap`.

`RemoteData` is an interface across four possible states, named Ok, Error, Loading and NotAsked. Notice that there is no `type` or identifying information present in a `RemoteData` object.

So how do we work with the data we've loaded? That's where `when` comes into play.

Let's map over our `result$` and put it into a `view`.


```ts
function main(sources) {
  const results$ = sources.RemoteData.request({
    method: 'GET',
    url: 'https://api.github.com/search/repositories?q=cycle'
  });

  return {
    DOM: results$.map(view)
  }
}
```

So how do we define our view?

```ts
function view(remoteData) {
  return remoteData.when({
    Ok: response => div(JSON.stringify(response.body)),
    Error: () => div('An error occurred loading data...'),
    Loading: () => div('Loading...'),
    NotAsked: () => div('')
  })
}
```

We can use the `when` method to handle all of the possible cases. Our `RemoteData` will start out `Loading`, and then progress into either `Ok` or `Error`.

Whenever the `RemoteData` state changes our `results$` will update, and our `when` will be called again.

You may wonder where `NotAsked` comes into it. `NotAsked` is not a state that `cycle-remote-data` will ever emit, but it can be useful to import `NotAsked` and `.startWith(NotAsked)`.

This is useful for example when you have a search box, and you want it to say 'Type something to search' when nothing has been searched or it has been cleared.

The above example does have an ugly part, in that we are working with responses directly in our view. What we need is a way to apply functions to the `Ok` value before calling `when`.

This is where `rmap` is handy. We could alter our main function to pull the body off of the response.

```ts
function main(sources) {
  const response$ = sources.RemoteData.request({
    method: 'GET',
    url: 'https://api.github.com/search/repositories?q=cycle'
  });

  const results$ = response$.map(remoteData => remoteData.rmap(response => response.body));

  return {
    DOM: results$.map(view)
  }
}
```

`remoteData.rmap` takes a function that transforms the response. This is why `RemoteData` is actually a generic interface in TypeScript.

When you call `RemoteData.request`, you're actually getting a `MemoryStream<RemoteData<superagent.Response>>`. Calling `.rmap` on the `RemoteData` will return a `RemoteData` with the generic type of the return value of your `rmap` function.

## Example

This is a larger example that includes a `reload` button on errors, uses a `NotAsked` state at the start, and cancels old requests when new searches are made.

```ts
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
```

## Install

Not yet published.

## Acknowledgments

`cycle-remote-data` is inspired by the excellent [remotedata package](http://package.elm-lang.org/packages/krisajenkins/remotedata/4.3.3) for Elm, by [krisajenkins](https://github.com/krisajenkins).


## License

MIT

