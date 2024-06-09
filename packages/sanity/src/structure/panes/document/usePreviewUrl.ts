import {type SanityDocument} from '@sanity/types'
import {useCallback, useEffect, useRef, useState} from 'react'
import {BehaviorSubject, from, type Observable, of} from 'rxjs'
import {catchError, debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators'
import {isRecord, useSource} from 'sanity'

const isSanityDocument = (value: unknown): value is SanityDocument =>
  isRecord(value) && typeof value._id === 'string' && typeof value._type === 'string'

export function usePreviewUrl(value: Partial<SanityDocument> | undefined): string | undefined {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined)
  const [error, setError] = useState<unknown>(null)
  const {resolveProductionUrl} = useSource().document
  // @todo refactor out of useAsObservable, and instead use `of() + useMemoObservable` like we did for `useLoadableFromCreateLoadable`
  const value$ = useAsObservable(value)

  if (error) throw error

  useEffect(() => {
    value$
      .pipe(
        // this so that the preview URL isn't fetched on every keystroke
        debounceTime(500),
        switchMap((document) =>
          isSanityDocument(document) ? from(resolveProductionUrl({document})) : of(undefined),
        ),
        catchError((e) => {
          const message = isRecord(e) && typeof e.message === 'string' ? e.message : 'Unknown error'
          throw new Error(`An error was thrown while trying to get your preview url: ${message}`)
        }),
      )
      .subscribe({
        next: setPreviewUrl,
        error: setError,
      })
  }, [resolveProductionUrl, value$])

  return previewUrl
}

/**
 * React hook to convert any props or state value into an observable
 * Returns an observable representing updates to any React value (props, state or any other calculated value)
 * Note: the returned observable is the same instance throughout the component lifecycle
 * @deprecated use an `of` operator and `useMemoObservable` instead for a faster, more robust and  siimpler solution
 */
function useAsObservable<T>(value: T): Observable<T>
function useAsObservable<T, K>(
  value: T,
  operator: (input: Observable<T>) => Observable<K>,
): Observable<K>
function useAsObservable<T, K = T>(
  value: T,
  operator?: (input: Observable<T>) => Observable<K>,
): Observable<T | K> {
  const setup = useCallback((): [Observable<T | K>, BehaviorSubject<T>] => {
    const subject = new BehaviorSubject(value)

    const observable = subject.asObservable().pipe(distinctUntilChanged())
    return [operator ? observable.pipe(operator) : observable, subject]
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we want to delete this hook and use `of + useObservable` from `react-rx` instead
  }, [])

  const ref = useRef<[Observable<T | K>, BehaviorSubject<T>]>()

  if (!ref.current) {
    ref.current = setup()
  }

  const [observable] = ref.current

  useEffect(() => {
    if (!ref.current) {
      return
    }
    const [, subject] = ref.current
    subject.next(value)
  }, [value, ref])

  const shouldRestoreSubscriptionRef = useRef(false)
  useEffect(() => {
    if (shouldRestoreSubscriptionRef.current) {
      if (!ref.current) {
        ref.current = setup()
      }
      shouldRestoreSubscriptionRef.current = false
    }

    return () => {
      if (!ref.current) {
        return
      }
      // React StrictMode will call effects as `setup + teardown + setup` thus we can't trust this callback as "react is about to unmount"
      // Tracking this ref lets us set the subscription back up on the next `setup` call if needed, and if it really did unmounted then all is well
      shouldRestoreSubscriptionRef.current = true
      const [, subject] = ref.current
      subject.complete()
      ref.current = undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we want to delete this hook and use `of + useObservable` from `react-rx` instead
  }, [])
  return observable
}
