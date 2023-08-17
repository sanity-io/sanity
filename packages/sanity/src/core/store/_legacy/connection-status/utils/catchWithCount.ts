import {Observable, OperatorFunction} from 'rxjs'
import {catchError, tap} from 'rxjs/operators'

type Selector<T, K> = (error: any, attemptNo: number, caught: Observable<T>) => Observable<K>

export function catchWithCount<T, K = T>(selector: Selector<T, K>): OperatorFunction<T, K>

export function catchWithCount<T, K = T>(selector: Selector<T, K>) {
  return (input$: Observable<T>) => {
    let errors: any[] = []

    const errorOp: OperatorFunction<any, any> = catchError((err, caught: Observable<T>) => {
      errors.push(err)
      return selector(err, errors.length, caught).pipe(errorOp)
    })
    return input$.pipe(
      tap(() => {
        errors = []
      }),
      errorOp,
    )
  }
}
