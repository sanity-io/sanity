import {type SanityDocument} from '@sanity/types'
import {useEffect, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {BehaviorSubject, from, of} from 'rxjs'
import {catchError, debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators'
import {isRecord, useSource} from 'sanity'

const isSanityDocument = (value: unknown): value is SanityDocument =>
  isRecord(value) && typeof value._id === 'string' && typeof value._type === 'string'

export function usePreviewUrl(value: Partial<SanityDocument> | undefined): string | undefined {
  const {resolveProductionUrl} = useSource().document
  const subject = useMemo(
    () => new BehaviorSubject<Partial<SanityDocument> | undefined>(undefined),
    [],
  )

  useEffect(() => {
    subject.next(value)
  }, [subject, value])

  const resolvedUrlObservable = useMemo(() => {
    return subject.asObservable().pipe(
      // this so that the preview URL isn't fetched on every keystroke
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((document) =>
        isSanityDocument(document) ? from(resolveProductionUrl({document})) : of(undefined),
      ),
      distinctUntilChanged(),
      catchError((err) => {
        const message =
          isRecord(err) && typeof err.message === 'string' ? err.message : 'Unknown error'
        throw new Error(`An error was thrown while trying to get your preview url: ${message}`)
      }),
    )
  }, [resolveProductionUrl, subject])

  return useObservable(resolvedUrlObservable)
}
