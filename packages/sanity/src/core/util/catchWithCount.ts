import {type Observable, type OperatorFunction} from 'rxjs'
import {catchError, tap} from 'rxjs/operators'

type Selector<T, K> = (error: unknown, attemptNo: number, caught: Observable<T>) => Observable<K>

/**
 * Like catchError, but passes the number of successive errors as the second argument to the selector function
 * @internal
 * @hidden
 */
export function catchWithCount<T, K = T>(selector: Selector<T, K>): OperatorFunction<T, K>
export function catchWithCount<T, K = T>(selector: Selector<T, K>) {
  return (input$: Observable<T>) => {
    let successiveErrorsCount = 0

    const errorOp: OperatorFunction<any, any> = catchError(
      (err: unknown, caught: Observable<T>) => {
        successiveErrorsCount++
        return selector(err, successiveErrorsCount, caught).pipe(errorOp)
      },
    )
    return input$.pipe(
      tap(() => {
        // Reset when source stream emits a value (i.e. not errors)
        successiveErrorsCount = 0
      }),
      errorOp,
    )
  }
}
