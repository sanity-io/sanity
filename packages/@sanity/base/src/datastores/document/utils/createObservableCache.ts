import {Observable} from 'rxjs'
import {finalize} from 'rxjs/operators'

export function createObservableCache<T>() {
  const CACHE: {[key: string]: Observable<T>} = Object.create(null)
  return function cacheBy<K>(id: string) {
    return (input$: Observable<T>): Observable<T> => {
      if (!(id in CACHE)) {
        CACHE[id] = input$.pipe(
          finalize(() => {
            delete CACHE[id]
          })
        )
      }
      return CACHE[id]
    }
  }
}
