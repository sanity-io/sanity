import {type SanityDocument} from '@sanity/client'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {catchError, of, tap} from 'rxjs'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, getBundleSlug, useBundles, useClient} from 'sanity'

export interface DocumentPerspectiveProps {
  documentId: string
}

export interface DocumentPerspectiveState {
  data: SanityDocument[] | null
  error?: Error
  loading: boolean
}

export function useDocumentPerspective(props: DocumentPerspectiveProps): DocumentPerspectiveState {
  const {documentId} = props

  const [state, setState] = useState<SanityDocument[] | null>(null)

  const [error, setError] = useState<Error | undefined>(undefined)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [loading, setLoading] = useState<boolean>(client !== null)
  const {data: bundles} = useBundles()
  const pureDocumentId =
    documentId.indexOf('.') > 0 ? documentId.slice(0, documentId.indexOf('.')) : documentId

  const QUERY = `*[sanity::versionOf("${pureDocumentId}")]`

  const initialFetch = useCallback(async () => {
    if (!client) {
      setLoading(false)
      return
    }

    try {
      const res = await client.fetch(QUERY)

      const documentBundles = res
        ?.map((r: SanityDocument) =>
          bundles?.find((b) => r._version && getBundleSlug(r._id) === b.slug),
        )
        .filter((b: SanityDocument) => b !== undefined)

      setState(documentBundles)
      setLoading(false)
    } catch (err) {
      setError(err)
      setLoading(false)
    }
  }, [QUERY, bundles, client])

  const listener$ = useMemo(() => {
    if (!client) return of()

    const events$ = client.observable.listen(QUERY).pipe(
      //map((event) => ({event})),
      // eslint-disable-next-line no-console
      tap((event) => console.log('Event:', event)), // This will log each event to the console
      catchError((err) => {
        setError(err)
        return of() // return an empty observable on error
      }),
    )

    return events$
  }, [QUERY, client])

  const handleListenerEvent = useCallback(async (event) => {
    // eslint-disable-next-line no-console
    console.log('Handle Listener Event:', {event})

    if (event.type === 'mutation') {
      /*const prev = event.result

        const updatedBundles = state?.map((b: SanityDocument) =>
          b.slug === getBundleSlug(prev._id) ? prev : b,
        )

        setState(updatedBundles || [])*/
      //setState()
    }
    // Handle the event here (e.g., update the state with new data)
    //initialFetch()
  }, [])

  useEffect(() => {
    initialFetch()

    const sub = listener$.subscribe({
      next: handleListenerEvent,
      error: (err) => {
        console.error('Listener Error:', err)
        setError(err as Error)
      },
    })

    return () => {
      sub?.unsubscribe()
    }
  }, [handleListenerEvent, listener$, initialFetch])

  return {
    data: state,
    error,
    loading,
  }
}
