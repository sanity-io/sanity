import {Observable, of as observableOf, from as observableFrom, isObservable} from 'rxjs'
import {map, mergeAll, combineAll, switchMap, scan} from 'rxjs/operators'

function setKey(source, key, value) {
  return {
    ...source,
    [key]: value,
  }
}

function keys<T>(value: T) {
  return Object.keys(value) as (keyof T)[]
}

type Props<K extends keyof any, T> = {
  [P in K]: T | Observable<T>
}

export default function props<K extends keyof any, T>(options: {wait?: boolean} = {}) {
  return (source: Observable<Props<K, T>>) => {
    return new Observable<Props<K, T>>((observer) => source.subscribe(observer)).pipe(
      switchMap((object) => {
        const keyObservables = keys(object).map((key) => {
          const value = object[key]
          return isObservable(value)
            ? observableFrom(value).pipe(map((val) => [key, val]))
            : observableOf([key, value])
        })

        return options.wait
          ? observableFrom(keyObservables).pipe(
              combineAll(),
              map((pairs) => pairs.reduce((acc, [key, value]) => setKey(acc, key, value), {}))
            )
          : observableFrom(keyObservables).pipe(
              mergeAll(),
              scan((acc, [key, value]) => setKey(acc, key, value), {})
            )
      })
    )
  }
}
