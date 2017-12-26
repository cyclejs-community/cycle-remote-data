import * as superagent from 'superagent';
import xs, {MemoryStream} from 'xstream';

interface Cases<T> {
  NotAsked: () => T;
  Loading: () => T;
  Error: (err: Error) => T;
  Ok: (response: superagent.Response) => T;
}

export interface RemoteData {
  match<T>(cases: Cases<T>): T
};

const NotAsked = {
  type: 'NotAsked',

  match<T> (cases: Cases<T>) {
    return cases.NotAsked();
  }
}

const Loading = {
  type: 'Loading',

  match<T> (cases: Cases<T>) {
    return cases.Loading();
  }
}

const ErrorResponse = (err: Error) => ({
  type: 'Error',

  match<T>(cases: Cases<T>) {
    return cases.Error(err);
  }
})


const Ok = (response: superagent.Response) => ({
  type: 'Ok',
  match<T>(cases: Cases<T>) {
    return cases.Ok(response);
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
