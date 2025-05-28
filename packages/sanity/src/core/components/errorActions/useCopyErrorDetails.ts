import {useToast} from '@sanity/ui'
import {pick} from 'lodash'
import {useCallback} from 'react'
import {catchError, EMPTY, map, of, type OperatorFunction, tap} from 'rxjs'

import {isRecord} from '../../util'
import {strings} from './strings'
import {type ErrorWithId} from './types'

const TOAST_ID = 'copyErrorDetails'

/**
 * @internal
 */
export function useCopyErrorDetails(error: unknown, eventId?: string | null): () => void {
  const toast = useToast()

  return useCallback(() => {
    of<ErrorWithId>({error, eventId})
      .pipe(
        serializeError(),
        catchError((serializeErrorError) => {
          console.error(serializeErrorError)
          toast.push({
            status: 'error',
            title: strings['copy-error-details.toast.get-failed'],
            id: TOAST_ID,
          })
          return EMPTY
        }),
        tap((errorDetailsString) => navigator.clipboard.writeText(errorDetailsString)),
        catchError((copyErrorError) => {
          console.error(copyErrorError)
          toast.push({
            status: 'error',
            title: strings['copy-error-details.toast.copy-failed'],
            id: TOAST_ID,
          })
          return EMPTY
        }),
      )
      .subscribe()
  }, [error, eventId, toast])
}

/**
 * @internal
 */
export function serializeError(): OperatorFunction<ErrorWithId, string> {
  return map<ErrorWithId, string>(({error, eventId}) => {
    // Extract the non-enumerable properties of the provided `error` object. This is particularly
    // useful if the provided `error` value is an instance of `Error`, whose properties are
    // non-enumerable.
    const errorInfo = isRecord(error) ? pick(error, Object.getOwnPropertyNames(error)) : undefined
    return JSON.stringify({error: errorInfo, eventId}, null, 2)
  })
}
