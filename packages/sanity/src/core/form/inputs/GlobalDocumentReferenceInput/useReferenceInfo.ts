import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map, startWith} from 'rxjs/operators'

import {type GlobalDocumentReferenceInfo} from './types'

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

const INITIAL_LOADING_STATE: Loadable<GlobalDocumentReferenceInfo> = {
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

export type GetReferenceInfoFn = (doc: {
  _id: string
  _type?: string
}) => Observable<GlobalDocumentReferenceInfo>

export function useReferenceInfo(
  doc: {_id: string; _type?: string} | null,
  getReferenceInfo: GetReferenceInfoFn,
): Loadable<GlobalDocumentReferenceInfo> {
  const [retryAttempt, setRetryAttempt] = useState<number>(0)

  const retry = useCallback(() => {
    setRetryAttempt((current) => current + 1)
  }, [])

  const referenceInfoObservable = useMemo(() => {
    if (!doc) {
      return of(EMPTY_STATE)
    }

    return getReferenceInfo(doc).pipe(
      map(
        (result) =>
          ({
            isLoading: false,
            result,
            error: undefined,
            retry,
            retryAttempt,
          }) as const,
      ),
      startWith(INITIAL_LOADING_STATE),
      catchError((err: Error) => {
        console.error(err)
        return of({
          isLoading: false,
          result: undefined,
          error: err,
          retry,
          retryAttempt,
        } as const)
      }),
    )
  }, [doc, getReferenceInfo, retry, retryAttempt])
  return useObservable(referenceInfoObservable, INITIAL_LOADING_STATE)
}
