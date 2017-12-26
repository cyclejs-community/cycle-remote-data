"use strict";
exports.__esModule = true;
var src_1 = require("../src");
var dom_1 = require("@cycle/dom");
var time_1 = require("@cycle/time");
var run_1 = require("@cycle/run");
var xstream_1 = require("xstream");
function GithubSearch(sources) {
    var query$ = sources.DOM
        .select('.search')
        .events('input')
        .map(function (ev) { return ev.target.value; })
        .remember();
    var finishedTyping$ = query$
        .compose(sources.Time.debounce(250));
    var reload$ = sources.DOM.select('.reload').events('click');
    var data$ = xstream_1["default"].merge(finishedTyping$, reload$).map(function () { return query$.take(1); }).flatten();
    var post$ = data$
        .map(function (q) { return q === '' ? xstream_1["default"].of(src_1.NotAsked) : sources.RemoteData.get('/?' + q); })
        .flatten()
        .map(function (remoteData) { return remoteData.rmap(function (res) { return res.body; }); })
        .startWith(src_1.NotAsked);
    return {
        DOM: post$.map(view)
    };
}
function view(remotePost) {
    return dom_1.div([
        'Search github',
        dom_1.input('.search'),
        remotePost.match({
            Loading: loadingView,
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
function loadingView() {
    return dom_1.div([
        'Loading...'
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
