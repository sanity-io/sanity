import {Observable, of as observableOf, from as observableFrom} from 'rxjs'
import isObservable from 'is-observable'
import {map, mergeAll, combineAll, switchMap, scan} from 'rxjs/operators'

function setKey(source, key, value) {
  return {
    ...source,
    [key]: value,
  }
}

export default function props(options: {wait?: boolean} = {}) {
  return (source) => {
    return new Observable((observer) => source.subscribe(observer)).pipe(
      switchMap((object) => {
        const keyObservables = Object.keys(object).map((key) => {
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
