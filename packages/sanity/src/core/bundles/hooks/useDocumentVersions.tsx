import {type ListenEvent, type ListenOptions} from '@sanity/client'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {catchError, of} from 'rxjs'
import {
  type BundleDocument,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getBundleSlug,
  getPublishedId,
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

/**
 * Fetches the document versions for a given document
 * @param props - document Id of the document (might include bundle slug)
 * @returns - data: document versions, loading, errors
 * @hidden
 * @beta
 */
export function useDocumentVersions(props: DocumentPerspectiveProps): DocumentPerspectiveState {
  const {documentId} = props

  const [state, setState] = useState<BundleDocument[] | null>(null)

  const [error, setError] = useState<Error | undefined>(undefined)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {data: bundles} = useBundles()
  const publishedId = getPublishedId(documentId, documentId.includes('.'))

  const QUERY = `*[sanity::versionOf("${publishedId}")]`

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
    async (event: ListenEvent<Record<string, BundleDocument[]>>) => {
      if (event.type === 'welcome') {
        if (!state) {
          await initialFetch()
        }
      }

      if (event.type === 'mutation') {
        if (event.transition === 'disappear') {
          const removedDocumentId = getPublishedId(event.documentId)
          const updatedBundles = state?.filter(
            (b) => b._id !== removedDocumentId,
          ) as BundleDocument[]
          setState(updatedBundles)
        }
        const prev = event.result
        const exists = state?.find((b) => b.slug === getBundleSlug(prev?._id || ''))

        if (!prev) return
        if (exists) {
          const updatedBundles = state?.map((b: BundleDocument) =>
            exists ? prev : b,
          ) as BundleDocument[]
          setState(updatedBundles || [])
        } else {
          const newBundles = [...(state || []), prev] as BundleDocument[]
          setState(newBundles)
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
