import {useCallback, useLayoutEffect, useRef, useState} from 'react'
import {catchError, concatMap, map, startWith, tap} from 'rxjs/operators'
import {Observable, of, Subscription} from 'rxjs'
import {usePrevious} from '../../hooks/usePrevious'
import {ReferenceInfo} from './types'

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

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
  const [state, setState] = useState<Loadable<ReferenceInfo>>(INITIAL_LOADING_STATE)
  const [retryAttempt, setRetryAttempt] = useState<number>(0)

  const retry = useCallback(() => {
    setRetryAttempt((current) => current + 1)
  }, [])

  const subscription = useRef<Subscription>()
  // eslint-disable-next-line consistent-return
  useLayoutEffect(() => {
    subscription.current?.unsubscribe()
    subscription.current = of(id)
      .pipe(
        concatMap((refId: string | undefined) =>
          refId
            ? getReferenceInfo(refId).pipe(
                map(
                  (result) =>
                    ({
                      isLoading: false,
                      result,
                      error: undefined,
                      retry,
                    } as const)
                ),
                startWith(INITIAL_LOADING_STATE),
                catchError((err: Error) => {
                  console.error(err)
                  return of({isLoading: false, result: undefined, error: err, retry} as const)
                })
              )
            : of(EMPTY_STATE)
        ),
        tap((nextState: Loadable<ReferenceInfo>) => setState(nextState))
      )
      .subscribe()
    return () => {
      subscription.current?.unsubscribe()
    }
  }, [retryAttempt, getReferenceInfo, id, retry])

  const prevId = usePrevious(id)
  if (id !== prevId) {
    return INITIAL_LOADING_STATE
  }

  return state
}
