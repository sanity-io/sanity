import {Observable} from 'rxjs'
import {finalize} from 'rxjs/operators'

export function createMemoizer<T>() {
  const MEMO: {[key: string]: Observable<T>} = Object.create(null)
  return function memoizeOn<K>(id: string) {
    return (input$: Observable<T>): Observable<T> => {
      if (!(id in MEMO)) {
        MEMO[id] = input$.pipe(
          finalize(() => {
            delete MEMO[id]
          })
        )
      }
      return MEMO[id]
    }
  }
}
