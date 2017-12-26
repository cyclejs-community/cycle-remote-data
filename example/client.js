"use strict";
exports.__esModule = true;
var src_1 = require("../src");
var dom_1 = require("@cycle/dom");
var time_1 = require("@cycle/time");
var run_1 = require("@cycle/run");
var xstream_1 = require("xstream");
function GithubSearch(sources) {
    var query$ = sources.DOM
        .select('.search-query')
        .events('input')
        .map(function (ev) { return ev.target.value; })
        .remember();
    var finishedTyping$ = query$
        .compose(sources.Time.debounce(250));
    var search$ = sources.DOM
        .select('.search')
        .events('click');
    var reload$ = sources.DOM.select('.reload').events('click');
    var data$ = xstream_1["default"].merge(finishedTyping$, reload$, search$).map(function () { return query$.take(1); }).flatten();
    var loadingProgress$ = sources.Time.periodic(300).map(function (i) { return (i % 3) + 1; });
    var post$ = data$
        .map(function (q) {
        if (q === '') {
            return xstream_1["default"].of(src_1.NotAsked);
        }
        ;
        return sources.RemoteData.get('/?' + q);
    })
        .flatten()
        .map(function (remoteData) { return remoteData.rmap(function (res) { return res.body; }); })
        .startWith(src_1.NotAsked);
    return {
        DOM: xstream_1["default"].combine(post$, loadingProgress$).map(view)
    };
}
function view(_a) {
    var remotePost = _a[0], loadingProgress = _a[1];
    return dom_1.div([
        dom_1.div('Search github'),
        dom_1.input('.search-query'),
        dom_1.button('.search', 'Search'),
        remotePost.match({
            Loading: function () { return loadingView(loadingProgress); },
            Error: errorView,
            Ok: postsView,
            NotAsked: notAskedView
        })
    ]);
}
function errorView() {
    return dom_1.div([
        'Error loading content',
        dom_1.button('.reload', "Reload")
    ]);
}
function loadingView(progress) {
    return dom_1.div([
        'Loading' + Array(progress).fill('.').join('')
    ]);
}
function notAskedView() {
    return dom_1.div([
        'Search for something!'
    ]);
}
function postsView(posts) {
    if (posts.length === 0) {
        return dom_1.div('No results found');
    }
    return dom_1.div(posts.map(function (post) { return dom_1.div('.post', post.name + ' - ' + post.value); }));
}
var drivers = {
    DOM: dom_1.makeDOMDriver(document.body),
    RemoteData: src_1.makeRemoteDataDriver(),
    Time: time_1.timeDriver
};
run_1.run(GithubSearch, drivers);
