import {
  combineLatest,
  from,
  isObservable,
  map,
  mergeAll,
  Observable,
  of,
  scan,
  switchMap,
} from 'rxjs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props<K extends keyof any, T> = {
  [P in K]: T | Observable<T>
}

function keysOf<T extends object>(value: T) {
  return Object.keys(value) as (keyof T)[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setKey(source: Record<string, unknown>, key: any, value: unknown) {
  return {
    ...source,
    [key]: value,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function props<K extends keyof any, T>(options: {wait?: boolean} = {}) {
  return (source: Observable<Props<K, T>>): Observable<Record<string, unknown>> => {
    return new Observable<Props<K, T>>((observer) => source.subscribe(observer)).pipe(
      switchMap((object) => {
        const keyObservables = keysOf(object).map((key) => {
          const value = object[key]
          return isObservable(value) ? from(value).pipe(map((val) => [key, val])) : of([key, value])
        })

        return options.wait
          ? combineLatest(keyObservables).pipe(
              map((pairs) => pairs.reduce((acc, [key, value]) => setKey(acc, key, value), {})),
            )
          : from(keyObservables).pipe(
              mergeAll(),
              scan((acc, [key, value]) => setKey(acc, key, value), {}),
            )
      }),
    )
  }
}
