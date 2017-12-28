import { RequestOptions } from '@cycle/http';
import { optionsToSuperagent } from '@cycle/http/lib/cjs/http-driver';
import * as superagent from 'superagent';
import xs, { MemoryStream } from 'xstream';

export interface RemoteDataSource {
  request(options: RequestOptions): MemoryStream<RemoteResponse>;
}

export interface Cases<T, U> {
  NotAsked: () => U;
  Loading: (progress: number) => U;
  Error: (err: Error) => U;
  Ok: (value: T) => U;
}

export interface RemoteData<T> {
  when<U>(cases: Cases<T, U>): U;
  rmap<V>(f: (t: T) => V): RemoteData<V>;
}

export type RemoteResponse = RemoteData<superagent.Response>;

export const NotAsked = {
  when<U>(cases: Cases<any, U>): U {
    return cases.NotAsked();
  },

  rmap() {
    return NotAsked;
  }
};

function Loading<T>(progress: number): RemoteData<T> {
  return {
    when<U>(cases: Cases<any, U>): U {
      return cases.Loading(progress);
    },

    rmap<V>() {
      return Loading<V>(progress);
    }
  };
}

function ErrorResponse<T>(err: Error): RemoteData<T> {
  return {
    when<U>(cases: Cases<any, U>): U {
      return cases.Error(err);
    },

    rmap<V>() {
      return ErrorResponse<V>(err);
    }
  };
}

function Ok<T>(value: T): RemoteData<T> {
  return {
    when<U>(cases: Cases<T, U>): U {
      return cases.Ok(value);
    },

    rmap<V>(f: (t: T) => V): RemoteData<V> {
      return Ok(f(value));
    }
  };
}

function requestToResponse(
  requestOptions: RequestOptions
): MemoryStream<RemoteData<superagent.Response>> {
  let request: superagent.Request;

  return xs.createWithMemory({
    start(listener) {
      request = optionsToSuperagent(requestOptions);

      listener.next(Loading(0));

      if (requestOptions.progress) {
        request = request.on('progress', ev =>
          listener.next(Loading(ev.percent || 0))
        );
      }

      request.end((err, res) => {
        if (err) {
          listener.next(ErrorResponse(err));
        } else {
          listener.next(Ok(res));
        }
      });
    },

    stop() {
      request.abort();
    }
  });
}

export function makeRemoteDataDriver() {
  return function remoteDataDriver(): RemoteDataSource {
    return { request: requestToResponse };
  };
}
