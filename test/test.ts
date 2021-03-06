import * as assert from 'assert';
import * as superagent from 'superagent';
import * as http from 'http';
import { makeRemoteDataDriver, RemoteResponse } from '../src/';


const server = http.createServer(function (req, res) {
  if (req.url === '/err') {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({}));

  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({hello: 'world'}));
});

describe('remoteDataDriver', () => {
  before(() => server.listen(8090));
  after(() => server.close());

  it('allows fetching remote data', (done) => {
    const driver = makeRemoteDataDriver()();

    function f (remoteData: RemoteResponse) {
      return remoteData.when({
        Ok (response) { return {status: 'success ' + response.body} },
        Loading () { return {status: 'loading'} },
        Error () { return {status: 'error'} },
        NotAsked () { return {status: 'not asked'} }
      });
    }

    const states = [
      {status: 'loading'},
      {status: 'success hello world'}
    ]

    driver.request({method: 'GET', url: 'localhost:8090'}).map(f).take(states.length).addListener({
      next (actual) {
        const expected = states.shift();

        assert.deepEqual(actual.status, (expected as any).status);
      },
      error: done,
      complete: done
    });
  });

  it('handles errors', (done) => {
    const driver = makeRemoteDataDriver()();

    function f (remoteData: RemoteResponse) {
      return remoteData.when({
        Ok (response) { return {status: 'success ' + response.body} },
        Loading () { return {status: 'loading'} },
        Error (error) { return {status: 'error', error} },
        NotAsked () { return {status: 'not asked'} }
      });
    }

    const states = [
      {status: 'loading'},
      {status: 'error'}
    ]

    driver.request({method: 'GET', url: 'localhost:8090/err'}).map(f).take(states.length).addListener({
      next (actual) {
        const expected = states.shift();

        assert.deepEqual(actual.status, (expected as any).status);

        if (actual.status === 'error') {
          assert.equal((actual as any).error.response.request.url, 'localhost:8090/err');
        }
      },
      error: done,
      complete: done
    });
  });
});

