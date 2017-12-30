import { Response, RequestOptions } from '@cycle/http/lib/cjs/interfaces';
import { optionsToSuperagent } from '@cycle/http/lib/cjs/http-driver';
import * as superagent from 'superagent';
import xs, { Listener, MemoryStream } from 'xstream';

export interface RemoteDataSource {
  request(options: RequestOptions): MemoryStream<RemoteResponse>;
}

export type RemoteResponse = RemoteData<Response>;

export interface RemoteData<T> {
  when<U>(cases: Cases<T, U>): U;
  rmap<V>(f: (t: T) => V): RemoteData<V>;
}

export interface Cases<T, U> {
  NotAsked: () => U;
  Loading: (progress: number) => U;
  Error: (err: ResponseError) => U;
  Ok: (value: T) => U;
}

export interface ResponseError extends Error {
  response: Response;
}

export function rmap<T, U>(f: (t: T) => U): (r: RemoteData<T>) => RemoteData<U> {
  return r => r.rmap(f);
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

      request.end(processResponse(requestOptions, listener));
    },

    stop() {
      request.abort();
    }
  });
}

function processResponse(request: RequestOptions, listener: Listener<RemoteResponse>) {
  return (error: ResponseError | null, response: Response) => {
    response.request = request;

    if (error) {
      error.response = response;

      listener.next(ErrorResponse(error));
    } else {
      listener.next(Ok(response));
    }

    listener.complete();
  }
}

export function makeRemoteDataDriver() {
  return function remoteDataDriver(): RemoteDataSource {
    return { request: requestToResponse };
  };
}
