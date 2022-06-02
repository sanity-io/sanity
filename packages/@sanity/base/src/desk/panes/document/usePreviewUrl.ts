import {useEffect, useState} from 'react'
import {SanityDocument} from '@sanity/types'
import {useAsObservable} from 'react-rx'
import {debounceTime, switchMap, catchError} from 'rxjs/operators'
import {from, of} from 'rxjs'
import {useSource} from '../../../studio'
import {isRecord} from '../../../util'

const isSanityDocument = (value: unknown): value is SanityDocument =>
  isRecord(value) && typeof value._id === 'string' && typeof value._type === 'string'

export function usePreviewUrl(value: Partial<SanityDocument> | undefined): string | undefined {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined)
  const [error, setError] = useState<unknown>(null)
  const {resolveProductionUrl} = useSource().document
  const value$ = useAsObservable(value)

  if (error) throw error

  useEffect(() => {
    value$
      .pipe(
        // this so that the preview URL isn't fetched on every keystroke
        debounceTime(500),
        switchMap((document) =>
          isSanityDocument(document) ? from(resolveProductionUrl({document})) : of(undefined)
        ),
        catchError((e) => {
          const message = isRecord(e) && typeof e.message === 'string' ? e.message : 'Unknown error'
          throw new Error(`An error was thrown while trying to get your preview url: ${message}`)
        })
      )
      .subscribe({
        next: setPreviewUrl,
        error: setError,
      })
  }, [resolveProductionUrl, value$])

  return previewUrl
}
