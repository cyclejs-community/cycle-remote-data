import { Response, RequestOptions } from '@cycle/http/lib/cjs/interfaces';
import { optionsToSuperagent } from '@cycle/http/lib/cjs/http-driver';
import * as superagent from 'superagent';
import xs, { MemoryStream } from 'xstream';

export interface RemoteDataSource {
  request(options: RequestOptions): MemoryStream<RemoteResponse>;
}

export interface Cases<T, U> {
  NotAsked: () => U;
  Loading: (progress: number) => U;
  Error: (err: ResponseError) => U;
  Ok: (value: T) => U;
}

export interface RemoteData<T> {
  when<U>(cases: Cases<T, U>): U;
  rmap<V>(f: (t: T) => V): RemoteData<V>;
}

export function rmap<T, U>(f: (t: T) => U): (r: RemoteData<T>) => RemoteData<U> {
  return r => r.rmap(f);
}

export type RemoteResponse = RemoteData<Response>;

export interface ResponseError extends Error {
  response: Response;
}

export const NotAsked = {
  when<U>(cases: Cases<any, U>): U {
    return cases.NotAsked();
  },

  rmap() {
    return NotAsked;
  }
};

export const NotAsked$ = xs.of(NotAsked).remember();

function Loading<T>(progress: number): RemoteData<T> {
  const loading = {
    when<U>(cases: Cases<any, U>): U {
      return cases.Loading(progress);
    },

    rmap() {
      return loading;
    }
  };

  return loading;
}

function ErrorResponse<T>(err: ResponseError): RemoteData<T> {
  const error = {
    when<U>(cases: Cases<any, U>): U {
      return cases.Error(err);
    },

    rmap() {
      return error;
    }
  };

  return error;
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
): MemoryStream<RemoteResponse> {
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

      request.end((err: ResponseError, res: Response) => {
        res.request = requestOptions;

        if (err) {
          err.response = res;

          listener.next(ErrorResponse(err));
        } else {
          listener.next(Ok(res));
        }

        listener.complete();
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
