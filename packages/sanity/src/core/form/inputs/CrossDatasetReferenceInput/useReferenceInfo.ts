import {useCallback, useMemo, useState} from 'react'
import {catchError, map, startWith} from 'rxjs/operators'
import {Observable, of} from 'rxjs'
import {useMemoObservable} from 'react-rx'
import {usePrevious} from '../../hooks/usePrevious'
import {CrossDatasetReferenceInfo} from './types'

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

const INITIAL_LOADING_STATE: Loadable<CrossDatasetReferenceInfo> = {
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
}) => Observable<CrossDatasetReferenceInfo>

export function useReferenceInfo(
  doc: {_id: string; _type?: string},
  getReferenceInfo: GetReferenceInfoFn
): Loadable<CrossDatasetReferenceInfo> {
  const [retryAttempt, setRetryAttempt] = useState<number>(0)

  const retry = useCallback(() => {
    setRetryAttempt((current) => current + 1)
  }, [])

  const docInfo = useMemo(() => ({_id: doc._id, _type: doc._type}), [doc._id, doc._type])
  const referenceInfo = useMemoObservable(
    () =>
      docInfo._id
        ? getReferenceInfo(docInfo).pipe(
            map(
              (result) =>
                ({
                  isLoading: false,
                  result,
                  error: undefined,
                  retry,
                  retryAttempt,
                } as const)
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
            })
          )
        : of(EMPTY_STATE),
    [docInfo, getReferenceInfo, retry, retryAttempt],
    INITIAL_LOADING_STATE
  )

  // workaround for a "bug" with useMemoObservable that doesn't
  // return the initial value upon resubscription
  const previousId = usePrevious(doc._id, doc._id)
  if (previousId !== doc._id) {
    return INITIAL_LOADING_STATE
  }
  return referenceInfo
}
