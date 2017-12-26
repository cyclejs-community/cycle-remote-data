import * as superagent from 'superagent';
import xs, {MemoryStream} from 'xstream';

interface Cases<T> {
  NotAsked: () => T;
  Loading: () => T;
  Error: (err: Error) => T;
  Ok: (response: superagent.Response) => T;
}

export interface RemoteData {
  match<T>(cases: Cases<T>): T;
  rmap(f: (a: any) => any): RemoteData;
};

export const NotAsked = {
  type: 'NotAsked',

  match<T> (cases: Cases<T>) {
    return cases.NotAsked();
  },

  rmap (f) {
    return NotAsked;
  }
}

const Loading = {
  type: 'Loading',

  match<T> (cases: Cases<T>) {
    return cases.Loading();
  },

  rmap (f) {
    return Loading;
  }
}

const ErrorResponse = (err: Error) => ({
  type: 'Error',

  match<T>(cases: Cases<T>) {
    return cases.Error(err);
  },

  rmap (f) {
    return ErrorResponse(err);
  }
})


const Ok = (response: superagent.Response) => ({
  type: 'Ok',
  match<T>(cases: Cases<T>) {
    return cases.Ok(response);
  },

  rmap (f) {
    return Ok(f(response));
  }
})


export function makeRemoteDataDriver () {
  return function remoteDataDriver () {
    const remoteDataSources = {
      get(url: string): MemoryStream<RemoteData> {
        return xs.createWithMemory({
          start (listener) {
            listener.next(Loading)

            superagent.get(url).end((err, res) => {
              if (err) {
                listener.next(ErrorResponse(err));
              } else {
                listener.next(Ok(res));
              }
            });
          },

          stop () {}
        })

      }
    }

    return remoteDataSources;
  }
}
