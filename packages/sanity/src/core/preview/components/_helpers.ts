import {Observable, of} from 'rxjs'
import {distinctUntilChanged, filter, switchMap, tap} from 'rxjs/operators'
import {isNonNullable} from '../../util'

/**
 * Will track a memo of the value as long as the isActive$ stream emits true,
 * and emit the memoized value after it switches to to false.
 *
 * (disclaimer: there's probably a better way to do this)
 */
export function _memoizeBy<T>(isActive$: Observable<boolean>) {
  return (producer$: Observable<T>): Observable<T> => {
    let memo: T
    return isActive$.pipe(
      distinctUntilChanged(),
      switchMap(
        (isActive): Observable<T> =>
          isActive ? producer$.pipe(tap((v) => (memo = v))) : of(memo).pipe(filter(isNonNullable)),
      ),
    )
  }
}
