"use strict";
exports.__esModule = true;
var superagent = require("superagent");
var xstream_1 = require("xstream");
;
exports.NotAsked = {
    type: 'NotAsked',
    match: function (cases) {
        return cases.NotAsked();
    },
    rmap: function (f) {
        return exports.NotAsked;
    }
};
var Loading = {
    type: 'Loading',
    match: function (cases) {
        return cases.Loading();
    },
    rmap: function (f) {
        return Loading;
    }
};
var ErrorResponse = function (err) { return ({
    type: 'Error',
    match: function (cases) {
        return cases.Error(err);
    },
    rmap: function (f) {
        return ErrorResponse(err);
    }
}); };
var Ok = function (response) { return ({
    type: 'Ok',
    match: function (cases) {
        return cases.Ok(response);
    },
    rmap: function (f) {
        return Ok(f(response));
    }
}); };
function makeRemoteDataDriver() {
    return function remoteDataDriver() {
        var remoteDataSources = {
            get: function (url) {
                var req;
                return xstream_1["default"].createWithMemory({
                    start: function (listener) {
                        listener.next(Loading);
                        req = superagent.get(url).end(function (err, res) {
                            if (err) {
                                listener.next(ErrorResponse(err));
                            }
                            else {
                                listener.next(Ok(res));
                            }
                        });
                    },
                    stop: function () {
                        req.abort();
                    }
                });
            }
        };
        return remoteDataSources;
    };
}
exports.makeRemoteDataDriver = makeRemoteDataDriver;
