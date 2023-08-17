import {
  combineLatest,
  from as observableFrom,
  isObservable,
  Observable,
  of as observableOf,
} from 'rxjs'
import {map, mergeAll, scan, switchMap} from 'rxjs/operators'
import {keysOf} from './keysOf'

function setKey(source: Record<string, unknown>, key: any, value: unknown) {
  return {
    ...source,
    [key]: value,
  }
}

type Props<K extends keyof any, T> = {
  [P in K]: T | Observable<T>
}

export function props<K extends keyof any, T>(options: {wait?: boolean} = {}) {
  return (source: Observable<Props<K, T>>) => {
    return new Observable<Props<K, T>>((observer) => source.subscribe(observer)).pipe(
      switchMap((object) => {
        const keyObservables = keysOf(object).map((key) => {
          const value = object[key]
          return isObservable(value)
            ? observableFrom(value).pipe(map((val) => [key, val]))
            : observableOf([key, value])
        })

        return options.wait
          ? combineLatest(keyObservables).pipe(
              map((pairs) => pairs.reduce((acc, [key, value]) => setKey(acc, key, value), {})),
            )
          : observableFrom(keyObservables).pipe(
              mergeAll(),
              scan((acc, [key, value]) => setKey(acc, key, value), {}),
            )
      }),
    )
  }
}
