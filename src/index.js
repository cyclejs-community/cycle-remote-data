"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var superagent = require("superagent");
var xstream_1 = require("xstream");
;
var NotAsked = {
    type: 'NotAsked',
    match: function (cases) {
        return cases.NotAsked();
    }
};
var Loading = {
    type: 'Loading',
    match: function (cases) {
        return cases.Loading();
    }
};
var ErrorResponse = function (err) { return ({
    type: 'Error',
    match: function (cases) {
        return cases.Error(err);
    }
}); };
var Ok = function (response) { return ({
    type: 'Ok',
    match: function (cases) {
        return cases.Ok(response);
    }
}); };
function makeRemoteDataDriver() {
    return function remoteDataDriver() {
        var remoteDataSources = {
            get: function (url) {
                return xstream_1.default.createWithMemory({
                    start: function (listener) {
                        listener.next(Loading);
                        superagent.get(url).end(function (err, res) {
                            if (err) {
                                listener.next(ErrorResponse(err));
                            }
                            else {
                                listener.next(Ok(res));
                            }
                        });
                    },
                    stop: function () { }
                });
            }
        };
        return remoteDataSources;
    };
}
exports.makeRemoteDataDriver = makeRemoteDataDriver;
