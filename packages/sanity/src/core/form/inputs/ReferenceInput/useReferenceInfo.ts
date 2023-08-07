import {useCallback, useMemo} from 'react'
import {catchError, concatMap, map, startWith, tap} from 'rxjs/operators'
import {concat, Observable, of, Subject} from 'rxjs'
import {useMemoObservable} from 'react-rx'
import {usePrevious} from '../../hooks/usePrevious'
import {ReferenceInfo} from './types'

const noop = () => undefined

const INITIAL_LOADING_STATE: Loadable<ReferenceInfo> = {
  isLoading: true,
  result: undefined,
  error: undefined,
  retry: noop,
}

const EMPTY_STATE: Loadable<any> = {
  isLoading: false,
  result: undefined,
  error: undefined,
  retry: noop,
}

export type Loadable<T> =
  | {isLoading: true; result: undefined; error: undefined; retry: () => void}
  | {isLoading: false; result: T; error: undefined; retry: () => void}
  | {isLoading: false; result: undefined; error: Error; retry: () => void}

type GetReferenceInfo = (id: string) => Observable<ReferenceInfo>

export function useReferenceInfo(
  id: string | undefined,
  getReferenceInfo: GetReferenceInfo
): Loadable<ReferenceInfo> {
  // NOTE: this is a small message queue to handle retries
  const msgSubject = useMemo(() => new Subject<{type: 'retry'}>(), [])
  const msg$ = useMemo(() => msgSubject.asObservable(), [msgSubject])

  const retry = useCallback(() => {
    msgSubject.next({type: 'retry'})
  }, [msgSubject])

  const referenceInfo = useMemoObservable(
    () =>
      concat(of(null), msg$).pipe(
        map(() => id),
        concatMap((refId: string | undefined) =>
          refId
            ? getReferenceInfo(refId).pipe(
                map((result) => {
                  return {
                    isLoading: false,
                    result,
                    error: undefined,
                    retry,
                  } as const
                }),
                startWith(INITIAL_LOADING_STATE),
                catchError((err: Error) => {
                  console.error(err)
                  return of({isLoading: false, result: undefined, error: err, retry} as const)
                })
              )
            : of(EMPTY_STATE)
        )
      ),
    [getReferenceInfo, id, msg$, retry],
    INITIAL_LOADING_STATE
  )

  // @todo test and see if this were fixed in `react-rx@2.1.x`
  // workaround for a "bug" with useMemoObservable that doesn't
  // return the initial value upon resubscription
  const previousId = usePrevious(id, id)
  if (id && previousId !== id) {
    return INITIAL_LOADING_STATE
  }
  return referenceInfo
}
