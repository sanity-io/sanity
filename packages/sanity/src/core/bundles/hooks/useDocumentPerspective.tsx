import {type ListenOptions} from '@sanity/client'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {catchError, of} from 'rxjs'
import {
  type BundleDocument,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getBundleSlug,
  useBundles,
  useClient,
} from 'sanity'

export interface DocumentPerspectiveProps {
  documentId: string
}

export interface DocumentPerspectiveState {
  data: BundleDocument[] | null
  error?: Error
}

const LISTEN_OPTIONS: ListenOptions = {
  events: ['welcome', 'mutation', 'reconnect'],
  includeResult: true,
  visibility: 'query',
}

export function useDocumentPerspective(props: DocumentPerspectiveProps): DocumentPerspectiveState {
  const {documentId} = props

  const [state, setState] = useState<BundleDocument[] | null>(null)

  const [error, setError] = useState<Error | undefined>(undefined)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {data: bundles} = useBundles()
  const pureDocumentId =
    documentId.indexOf('.') > 0
      ? documentId.slice(documentId.indexOf('.') + 1, documentId.length)
      : documentId

  const QUERY = `*[sanity::versionOf("${pureDocumentId}")]`

  const initialFetch = useCallback(async () => {
    if (!client) {
      return
    }

    try {
      const res = await client.fetch(QUERY)

      // build the document bundles
      const documentBundles = res
        ?.map((r: BundleDocument) =>
          bundles?.find((b) => r._version && getBundleSlug(r._id) === b.slug),
        )
        .filter((b: BundleDocument) => b !== undefined)

      setState(documentBundles)
    } catch (err) {
      setError(err)
    }
  }, [QUERY, bundles, client])

  const listener$ = useMemo(() => {
    if (!client) return of()

    const events$ = client.observable.listen(QUERY, {}, LISTEN_OPTIONS).pipe(
      catchError((err) => {
        setError(err)
        return of() // return an empty observable on error
      }),
    )

    return events$
  }, [QUERY, client])

  const handleListenerEvent = useCallback(
    async (event) => {
      if (event.type === 'welcome') {
        if (!state) {
          await initialFetch()
        }
      }

      if (event.type === 'mutation') {
        const prev = event.result
        const exists = state?.find((b) => b.slug === getBundleSlug(prev._id))

        if (exists) {
          const updatedBundles = state?.map((b: BundleDocument) => (exists ? prev : b))
          setState(updatedBundles || [])
        } else {
          setState([...(state || []), prev])
        }
      }
    },
    [initialFetch, state],
  )

  useEffect(() => {
    const sub = listener$.subscribe(handleListenerEvent)

    return () => {
      sub?.unsubscribe()
    }
  }, [handleListenerEvent, listener$, initialFetch])

  return {
    data: state,
    error,
  }
}
