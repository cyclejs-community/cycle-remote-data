import * as superagent from 'superagent';
import xs, {MemoryStream} from 'xstream';

export interface RemoteDataSource {
  get(url: string): MemoryStream<RemoteResponse>;
}

interface Cases<T, U> {
  NotAsked: () => U;
  Loading: () => U;
  Error: (err: Error) => U;
  Ok: (value: T) => U;
}

export interface RemoteData<T> {
  when<U>(cases: Cases<T, U>): U;
  rmap<V>(f: (v: T) => V): RemoteData<V>;
};

export type RemoteResponse = RemoteData<superagent.Response>;

export const NotAsked = {
  when<U> (cases: Cases<any, U>): U {
    return cases.NotAsked();
  },

  rmap () {
    return NotAsked;
  }
}

const Loading = {
  when<U> (cases: Cases<any, U>): U {
    return cases.Loading();
  },

  rmap () {
    return Loading;
  }
}

function ErrorResponse (err: Error): RemoteData<any> {
  return {
    when<U>(cases: Cases<any, U>): U {
      return cases.Error(err);
    },

    rmap () {
      return ErrorResponse(err);
    }
  }
}


function Ok<T>(value: T): RemoteData<T> {
  return {
    when<U>(cases: Cases<T, U>): U {
      return cases.Ok(value);
    },

    rmap<V> (f: (t: T) => V): RemoteData<V> {
      return Ok(f(value));
    }
  }
}


export function makeRemoteDataDriver () {
  return function remoteDataDriver (): RemoteDataSource {
    const remoteDataSources = {
      get(url: string): MemoryStream<RemoteData<superagent.Response>> {
        let request: superagent.Request;

        return xs.createWithMemory({
          start (listener) {
            listener.next(Loading)

            request = superagent.get(url).end((err, res) => {
              if (err) {
                listener.next(ErrorResponse(err));
              } else {
                listener.next(Ok(res));
              }
            });
          },

          stop () {
            request.abort();
          }
        })

      }
    }

    return remoteDataSources;
  }
}
