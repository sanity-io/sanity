import {type ListenOptions} from '@sanity/client'
import {uuid} from '@sanity/uuid' // Import the UUID library
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient, useCurrentUser} from 'sanity'
import {useStudioPreferenceList} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {DEFAULT_API_VERSION} from '../apiVersions'

const SHARED_QUERY_DOCUMENT_TYPE = 'vision.sharedQuery'
const SHARED_QUERIES_QUERY = `*[_type == $sharedQueryType]{
  _id,
  authorId,
  savedAt,
  title,
  url
} | order(savedAt desc)`
const SHARED_QUERY_LISTEN_OPTIONS: ListenOptions = {
  events: ['welcome', 'mutation', 'reconnect'],
  includeResult: true,
  visibility: 'query',
}

export type QueryConfig = {
  _key: string
  url: string
  savedAt: string
  title?: string
  shared?: boolean
  authorId?: string
  isOwnedByCurrentUser?: boolean
}

interface SharedQueryDocument {
  _id: string
  _type?: string
  authorId: string
  savedAt: string
  title?: string
  url: string
}

export function useSavedQueries(
  options: {
    /** Called with the key of a personal query a save is about to write, before the list shows it */
    onCreatePersonalQuery?: (key: string) => void
  } = {},
): {
  queries: QueryConfig[]
  /** Whether the shared queries have been fetched, so one missing from the list is not shared */
  sharedQueriesLoaded: boolean
  /** Resolves with the key of the saved query (the document id of a shared one) */
  saveQuery: (query: Omit<QueryConfig, '_key'>) => Promise<string>
  updateQuery: (query: QueryConfig) => Promise<void>
  deleteQuery: (key: string) => Promise<void>
  /** Deletes a shared query the current user authored; rejects when that fails */
  unshareQuery: (key: string) => Promise<void>
  saving: boolean
  deleting: string[]
  saveQueryError: Error | undefined
  deleteQueryError: Error | undefined
  error: Error | undefined
} {
  const {onCreatePersonalQuery} = options
  const {
    items: personalItems,
    error: personalError,
    set: setPersonalQuery,
  } = useStudioPreferenceList('studio.vision-tool.saved-queries')
  const workspaceClient = useClient({apiVersion: DEFAULT_API_VERSION})
  const currentUser = useCurrentUser()

  const [sharedQueries, setSharedQueries] = useState<QueryConfig[]>([])
  const [sharedQueriesLoaded, setSharedQueriesLoaded] = useState(false)
  // Saves and updates may overlap, so `saving` is derived from how many are in flight rather
  // than cleared by whichever one settles first
  const [pendingSaves, setPendingSaves] = useState(0)
  const [deleting, setDeleting] = useState<string[]>([])
  const [saveQueryError, setSaveQueryError] = useState<Error | undefined>()
  const [deleteQueryError, setDeleteQueryError] = useState<Error | undefined>()
  const [error, setError] = useState<Error | undefined>()

  const personalQueries: QueryConfig[] = useMemo(
    // Older lists had `_key`s with `:`, which an item's ID can't have, so the ID is the key now
    () => personalItems.map(({itemId, value}) => ({...value, _key: itemId})),
    [personalItems],
  )

  const mapSharedQueries = useCallback(
    (docs: SharedQueryDocument[]): QueryConfig[] => {
      const currentUserId = currentUser?.id

      return docs.map((doc) => ({
        _key: doc._id,
        authorId: doc.authorId,
        isOwnedByCurrentUser: doc.authorId === currentUserId,
        savedAt: doc.savedAt,
        shared: true,
        title: doc.title,
        url: doc.url,
      }))
    },
    [currentUser],
  )

  useEffect(() => {
    let cancelled = false

    const fetchSharedQueries = async () => {
      const docs = await workspaceClient.fetch<SharedQueryDocument[]>(SHARED_QUERIES_QUERY, {
        sharedQueryType: SHARED_QUERY_DOCUMENT_TYPE,
      })
      const nextDocs = docs || []
      if (!cancelled) {
        setSharedQueries(mapSharedQueries(nextDocs))
        setSharedQueriesLoaded(true)
      }
    }

    void fetchSharedQueries().catch((err) => {
      if (!cancelled) {
        setError(err as Error)
      }
    })

    const sub = workspaceClient.observable
      .listen(
        `*[_type == $sharedQueryType]`,
        {
          sharedQueryType: SHARED_QUERY_DOCUMENT_TYPE,
        },
        SHARED_QUERY_LISTEN_OPTIONS,
      )
      .subscribe({
        next: () => {
          void fetchSharedQueries().catch((err) => {
            if (!cancelled) {
              setError(err as Error)
            }
          })
        },
        error: (err) => {
          if (!cancelled) {
            setError(err as Error)
          }
        },
      })

    return () => {
      cancelled = true
      sub.unsubscribe()
    }
  }, [workspaceClient, mapSharedQueries])

  const queries = useMemo(() => {
    return [...sharedQueries, ...personalQueries].sort((a, b) => {
      return new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime()
    })
  }, [sharedQueries, personalQueries])

  /**
   * Runs a save or update as one of the saves in flight (`saving` holds until the last of them
   * has settled) and reports its failure through `saveQueryError` before rejecting with it
   */
  const runSave = useCallback(<T>(task: () => Promise<T>): Promise<T> => {
    setPendingSaves((count) => count + 1)
    setSaveQueryError(undefined)
    return task()
      .catch((err: unknown) => {
        const saveError = err instanceof Error ? err : new Error(String(err))
        setSaveQueryError(saveError)
        throw saveError
      })
      .finally(() => setPendingSaves((count) => count - 1))
  }, [])

  // Resolves with the key of the saved query (the document id of a shared one)
  const saveQuery = useCallback(
    (query: Omit<QueryConfig, '_key'>): Promise<string> =>
      runSave(async () => {
        if (query.shared) {
          if (!currentUser?.id) {
            throw new Error('No current user found. Unable to save shared query.')
          }
          const createdDoc = (await workspaceClient.create({
            _type: SHARED_QUERY_DOCUMENT_TYPE,
            authorId: currentUser.id,
            savedAt: query.savedAt,
            title: query.title,
            url: query.url,
          })) as SharedQueryDocument
          setSharedQueries((prev) => [...mapSharedQueries([createdDoc]), ...prev])
          return createdDoc._id
        }

        const newQuery = {...query, _key: uuid()}
        onCreatePersonalQuery?.(newQuery._key)
        await setPersonalQuery(newQuery._key, newQuery)
        return newQuery._key
      }),
    [
      currentUser,
      workspaceClient,
      mapSharedQueries,
      onCreatePersonalQuery,
      runSave,
      setPersonalQuery,
    ],
  )

  const updateQuery = useCallback(
    (query: QueryConfig): Promise<void> =>
      runSave(async () => {
        if (query.shared) {
          if (!currentUser?.id || query.authorId !== currentUser.id) {
            throw new Error('Only the author can update a shared query.')
          }
          const updatedDoc = (await workspaceClient
            .patch(query._key)
            .set({
              savedAt: query.savedAt,
              title: query.title,
              url: query.url,
            })
            .commit()) as SharedQueryDocument

          const [updatedSharedQuery] = mapSharedQueries([updatedDoc])
          setSharedQueries((prev) =>
            prev.map((existingQuery) =>
              existingQuery._key === query._key ? updatedSharedQuery : existingQuery,
            ),
          )
          return
        }

        await setPersonalQuery(query._key, query)
      }),
    [workspaceClient, currentUser, mapSharedQueries, runSave, setPersonalQuery],
  )

  // Rejects when the document could not be deleted; `deleteQuery` turns that into state
  const unshareQuery = useCallback(
    async (key: string) => {
      const sharedQuery = sharedQueries.find((query) => query._key === key && query.shared)
      if (!sharedQuery) {
        throw new Error(`No shared query with key "${key}"`)
      }
      if (!currentUser?.id || sharedQuery.authorId !== currentUser.id) {
        throw new Error('Only the author can unshare a shared query.')
      }
      await workspaceClient.delete(key)
      setSharedQueries((prev) => prev.filter((query) => query._key !== key))
    },
    [currentUser, sharedQueries, workspaceClient],
  )

  const deletePersonalQuery = useCallback(
    (key: string) => setPersonalQuery(key, undefined),
    [setPersonalQuery],
  )

  const deleteQuery = useCallback(
    async (key: string) => {
      setDeleting((prev) => [...prev, key])
      setDeleteQueryError(undefined)
      try {
        if (sharedQueries.some((query) => query._key === key && query.shared)) {
          await unshareQuery(key)
        } else {
          await deletePersonalQuery(key)
        }
      } catch (err) {
        setDeleteQueryError(err instanceof Error ? err : new Error(String(err)))
      }
      setDeleting((prev) => prev.filter((k) => k !== key))
    },
    [deletePersonalQuery, unshareQuery, sharedQueries],
  )

  return {
    queries,
    sharedQueriesLoaded,
    saveQuery,
    updateQuery,
    deleteQuery,
    unshareQuery,
    saving: pendingSaves > 0,
    deleting,
    saveQueryError,
    deleteQueryError,
    error: error ?? (personalError instanceof Error ? personalError : undefined),
  }
}
