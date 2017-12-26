"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var http = require("http");
var _1 = require("../src/");
var server = http.createServer(function (req, res) {
    if (req.url === '/err') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ hello: 'world' }));
});
describe('remoteDataDriver', function () {
    before(function () { return server.listen(8090); });
    after(function () { return server.close(); });
    it('allows fetching remote data', function (done) {
        var driver = _1.makeRemoteDataDriver()();
        function f(remoteData) {
            return remoteData.match({
                Ok: function (response) { return response.body; },
                Loading: function () { return { status: 'loading' }; },
                Error: function () { return { status: 'error' }; },
                NotAsked: function () { return { status: 'not asked' }; }
            });
        }
        var states = [
            { status: 'loading' },
            { hello: 'world' }
        ];
        driver.get('localhost:8090').map(f).take(states.length).addListener({
            next: function (actual) {
                var expected = states.shift();
                assert.deepEqual(actual, expected);
            },
            error: done,
            complete: done
        });
    });
    it('handles errors', function (done) {
        var driver = _1.makeRemoteDataDriver()();
        function f(remoteData) {
            return remoteData.match({
                Ok: function (response) { return response.body; },
                Loading: function () { return { status: 'loading' }; },
                Error: function () { return { status: 'error' }; },
                NotAsked: function () { return { status: 'not asked' }; }
            });
        }
        var states = [
            { status: 'loading' },
            { status: 'error' }
        ];
        driver.get('localhost:8090/err').map(f).take(states.length).addListener({
            next: function (actual) {
                var expected = states.shift();
                assert.deepEqual(actual, expected);
            },
            error: done,
            complete: done
        });
    });
});
