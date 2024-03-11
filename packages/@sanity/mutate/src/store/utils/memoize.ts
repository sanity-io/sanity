import {finalize, type Observable, shareReplay} from 'rxjs'

export function createMemoizer() {
  const memo: {[key: string]: Observable<any>} = Object.create(null)
  return function memoize<T>(
    key: string,
    observable: Observable<T>,
  ): Observable<T> {
    if (!(key in memo)) {
      memo[key] = observable.pipe(
        shareReplay({refCount: true, bufferSize: 1}),
        finalize(() => {
          delete memo[key]
        }),
      )
    }
    return memo[key]
  }
}
