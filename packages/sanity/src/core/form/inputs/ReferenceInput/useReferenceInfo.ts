import {observableCallback} from 'observable-callback'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {concat, type Observable, of} from 'rxjs'
import {catchError, concatMap, map, startWith} from 'rxjs/operators'

import {type ReferenceInfo} from './types'

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
  getReferenceInfo: GetReferenceInfo,
): Loadable<ReferenceInfo> {
  // NOTE: this is a small message queue to handle retries
  const [onRetry$, onRetry] = useMemo(() => observableCallback(), [])

  const referenceInfoObservable = useMemo(
    () =>
      concat(of(null), onRetry$).pipe(
        map(() => id),
        concatMap((refId: string | undefined) =>
          refId
            ? getReferenceInfo(refId).pipe(
                map((result) => {
                  return {
                    isLoading: false,
                    result,
                    error: undefined,
                    retry: onRetry,
                  } as const
                }),
                startWith(INITIAL_LOADING_STATE),
                catchError((err: Error) => {
                  console.error(err)
                  return of({
                    isLoading: false,
                    result: undefined,
                    error: err,
                    retry: onRetry,
                  } as const)
                }),
              )
            : of(EMPTY_STATE),
        ),
      ),
    [getReferenceInfo, id, onRetry, onRetry$],
  )
  return useObservable(referenceInfoObservable, INITIAL_LOADING_STATE)
}
