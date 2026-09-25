import {type ListenOptions} from '@sanity/client'
import {uuid} from '@sanity/uuid' // Import the UUID library
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type KeyValueStoreValue, useClient, useCurrentUser, useKeyValueStore} from 'sanity'

import {DEFAULT_API_VERSION} from '../apiVersions'

const STORED_QUERIES_NAMESPACE = 'studio.vision-tool.saved-queries'
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

export interface QueryConfig {
  _key: string
  url: string
  savedAt: string
  title?: string
  shared?: boolean
  authorId?: string
  isOwnedByCurrentUser?: boolean
}

export interface StoredQueries {
  queries: QueryConfig[]
}

const defaultValue = {
  queries: [],
}
const keyValueStoreKey = STORED_QUERIES_NAMESPACE

interface SharedQueryDocument {
  _id: string
  _type?: string
  authorId: string
  savedAt: string
  title?: string
  url: string
}

/** The error for a failed move whose rollback failed too: the query is now in both lists */
function moveLeftBothCopies(error: unknown, keptCopy: 'shared' | 'personal'): Error {
  const message = error instanceof Error ? error.message : String(error)
  return new Error(
    `${message} Removing the ${keptCopy} copy made for the move failed as well, so the query is now in both lists; delete the one you do not want.`,
    {cause: error},
  )
}

export function useSavedQueries(): {
  queries: QueryConfig[]
  /** Resolves with the key of the saved query (the document id of a shared one) */
  saveQuery: (query: Omit<QueryConfig, '_key'>) => Promise<string>
  updateQuery: (query: QueryConfig) => Promise<void>
  deleteQuery: (key: string) => Promise<void>
  /** Moves a personal query to the shared list, keeping its title */
  shareQuery: (key: string) => Promise<void>
  /** Moves a shared query the current user owns back to their personal list */
  unshareQuery: (key: string) => Promise<void>
  /** Removes every personal query; shared ones are left alone */
  clearQueries: () => Promise<void>
  saving: boolean
  deleting: string[]
  saveQueryError: Error | undefined
  deleteQueryError: Error | undefined
  error: Error | undefined
} {
  const keyValueStore = useKeyValueStore()
  const workspaceClient = useClient({apiVersion: DEFAULT_API_VERSION})
  const currentUser = useCurrentUser()

  const [value, setValue] = useState<StoredQueries>(defaultValue)
  const [sharedQueries, setSharedQueries] = useState<QueryConfig[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string[]>([])
  const [saveQueryError, setSaveQueryError] = useState<Error | undefined>()
  const [deleteQueryError, setDeleteQueryError] = useState<Error | undefined>()
  const [error, setError] = useState<Error | undefined>()

  // The personal list is one key-value entry that every mutation rewrites whole, so the writes
  // are queued and each one starts from the list the previous write produced rather than from a
  // render's snapshot: overlapping saves, deletes and moves cannot lose each other's changes
  const latestQueriesRef = useRef<QueryConfig[]>(defaultValue.queries)
  const personalWritesRef = useRef<Promise<unknown>>(Promise.resolve())
  // The store's emissions stop being that base while a write is pending, and for good once one
  // has landed: from then on they are echoes of this hook's own writes, or the initial server
  // read resolving late with the list from before them (the store only forwards its events
  // once that read is done, so a write made meanwhile is never echoed)
  const pendingPersonalWritesRef = useRef(0)
  const wrotePersonalQueriesRef = useRef(false)
  const loadedPersonalQueriesRef = useRef(false)

  const personalQueries = useMemo(() => {
    return keyValueStore.getKey(keyValueStoreKey)
  }, [keyValueStore])

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
    // The store emits its localStorage copy synchronously (`null` without one), the server's
    // list once read, and then every write. Nothing is prepended: this effect runs again when a
    // hidden `<Activity>` shows the tool again, and an initial value would reset the list, and
    // with it the base the next write starts from, to empty
    const sub = personalQueries.subscribe({
      next: (data) => {
        if (pendingPersonalWritesRef.current > 0 || wrotePersonalQueriesRef.current) return
        if (!data) {
          // No localStorage copy; the server's answer follows, and a list already shown stays
          if (loadedPersonalQueriesRef.current) return
          latestQueriesRef.current = defaultValue.queries
          setValue(defaultValue)
          return
        }
        const stored = data as unknown as StoredQueries
        loadedPersonalQueriesRef.current = true
        latestQueriesRef.current = stored.queries
        setValue(stored)
      },
      error: (err) => setError(err as Error),
    })

    return () => sub.unsubscribe()
  }, [personalQueries])

  useEffect(() => {
    let cancelled = false

    const fetchSharedQueries = async () => {
      const docs = await workspaceClient.fetch<SharedQueryDocument[]>(SHARED_QUERIES_QUERY, {
        sharedQueryType: SHARED_QUERY_DOCUMENT_TYPE,
      })
      const nextDocs = docs || []
      if (!cancelled) {
        setSharedQueries(mapSharedQueries(nextDocs))
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

  /** Runs `task` after every personal write queued so far, whatever their outcome */
  const enqueuePersonalWrite = useCallback(<T>(task: () => Promise<T>): Promise<T> => {
    pendingPersonalWritesRef.current += 1
    const run = () =>
      task()
        .then((written) => {
          wrotePersonalQueriesRef.current = true
          return written
        })
        .finally(() => {
          pendingPersonalWritesRef.current -= 1
        })
    const result = personalWritesRef.current.then(run, run)
    personalWritesRef.current = result.catch(() => undefined)
    return result
  }, [])

  /**
   * Replaces the personal list with `update(latest)`, optimistically in the UI and then in the
   * store; a failed store write puts the previous list back. Resolves with the written list.
   */
  const writePersonalQueries = useCallback(
    (update: (queries: QueryConfig[]) => QueryConfig[]): Promise<QueryConfig[]> =>
      enqueuePersonalWrite(async () => {
        const before = latestQueriesRef.current
        const next = update(before)
        latestQueriesRef.current = next
        setValue({queries: next})
        try {
          await keyValueStore.setKey(keyValueStoreKey, {
            queries: next,
          } as unknown as KeyValueStoreValue)
        } catch (err) {
          // The store kept the previous list, so the UI shows it again
          latestQueriesRef.current = before
          setValue({queries: before})
          throw err
        }
        return next
      }),
    [enqueuePersonalWrite, keyValueStore],
  )

  const queries = useMemo(() => {
    return [...sharedQueries, ...value.queries].sort((a, b) => {
      return new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime()
    })
  }, [sharedQueries, value.queries])

  // Resolves with the key of the saved query (the document id of a shared one)
  const saveQuery = useCallback(
    async (query: Omit<QueryConfig, '_key'>): Promise<string> => {
      setSaving(true)
      setSaveQueryError(undefined)

      if (query.shared) {
        if (!currentUser?.id) {
          const authError = new Error('No current user found. Unable to save shared query.')
          setSaveQueryError(authError)
          setSaving(false)
          throw authError
        }

        try {
          const createdDoc = (await workspaceClient.create({
            _type: SHARED_QUERY_DOCUMENT_TYPE,
            authorId: currentUser.id,
            savedAt: query.savedAt,
            title: query.title,
            url: query.url,
          })) as SharedQueryDocument
          setSharedQueries((prev) => [...mapSharedQueries([createdDoc]), ...prev])
          setSaving(false)
          return createdDoc._id
        } catch (err) {
          const saveError = err instanceof Error ? err : new Error(String(err))
          setSaveQueryError(saveError)
          setSaving(false)
          throw saveError
        }
      }

      const newQuery = {...query, _key: uuid()} // Add a unique _key to the query
      try {
        await writePersonalQueries((queries) => [newQuery, ...queries])
      } catch (err) {
        const saveError = err instanceof Error ? err : new Error(String(err))
        setSaveQueryError(saveError)
        setSaving(false)
        throw saveError
      }
      setSaving(false)
      return newQuery._key
    },
    [currentUser, workspaceClient, mapSharedQueries, writePersonalQueries],
  )

  const updateQuery = useCallback(
    async (query: QueryConfig) => {
      setSaving(true)
      setSaveQueryError(undefined)

      if (query.shared) {
        if (!currentUser?.id || query.authorId !== currentUser.id) {
          const authError = new Error('Only the author can update a shared query.')
          setSaveQueryError(authError)
          setSaving(false)
          throw authError
        }

        try {
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
          setSaving(false)
          return
        } catch (err) {
          const updateError = err instanceof Error ? err : new Error(String(err))
          setSaveQueryError(updateError)
          setSaving(false)
          throw updateError
        }
      }

      try {
        await writePersonalQueries((queries) =>
          queries.map((q) => (q._key === query._key ? {...q, ...query} : q)),
        )
      } catch (err) {
        const updateError = err instanceof Error ? err : new Error(String(err))
        setSaveQueryError(updateError)
        setSaving(false)
        throw updateError
      }
      setSaving(false)
    },
    [workspaceClient, currentUser, mapSharedQueries, writePersonalQueries],
  )

  // Rejects when the document could not be deleted; `deleteQuery` turns that into state
  const deleteSharedQuery = useCallback(
    async (key: string) => {
      const sharedQuery = sharedQueries.find((query) => query._key === key && query.shared)
      if (!sharedQuery) {
        throw new Error(`No shared query with key "${key}"`)
      }
      if (!currentUser?.id || sharedQuery.authorId !== currentUser.id) {
        throw new Error('Only the author can delete a shared query.')
      }
      await workspaceClient.delete(key)
      setSharedQueries((prev) => prev.filter((query) => query._key !== key))
    },
    [currentUser, sharedQueries, workspaceClient],
  )

  // Optimistic like the other personal mutations; rejects when the store write fails
  const deletePersonalQuery = useCallback(
    async (key: string) => {
      await writePersonalQueries((queries) => queries.filter((q) => q._key !== key))
    },
    [writePersonalQueries],
  )

  const deleteQuery = useCallback(
    async (key: string) => {
      setDeleting((prev) => [...prev, key])
      setDeleteQueryError(undefined)
      try {
        if (sharedQueries.some((query) => query._key === key && query.shared)) {
          await deleteSharedQuery(key)
        } else {
          await deletePersonalQuery(key)
        }
      } catch (err) {
        setDeleteQueryError(err instanceof Error ? err : new Error(String(err)))
      }
      setDeleting((prev) => prev.filter((k) => k !== key))
    },
    [deletePersonalQuery, deleteSharedQuery, sharedQueries],
  )

  // Moving a query between the personal store and the shared documents takes two writes to two
  // stores, so it cannot be atomic. When the second write fails, the first is taken back so the
  // query does not end up in both places and a retry cannot pile up copies; the move then rejects
  // with the original error. Should taking it back fail as well, both copies stay in the lists,
  // as they do in the stores, and the error says so.
  const shareQuery = useCallback(
    async (key: string) => {
      const query = latestQueriesRef.current.find((q) => q._key === key)
      if (!query) {
        throw new Error(`No personal saved query with key "${key}"`)
      }
      const sharedKey = await saveQuery({
        shared: true,
        title: query.title,
        url: query.url,
        savedAt: new Date().toISOString(),
      })
      try {
        await deletePersonalQuery(key)
      } catch (err) {
        try {
          await workspaceClient.delete(sharedKey)
          setSharedQueries((prev) => prev.filter((q) => q._key !== sharedKey))
        } catch {
          throw moveLeftBothCopies(err, 'shared')
        }
        throw err
      }
    },
    [deletePersonalQuery, saveQuery, workspaceClient],
  )

  const unshareQuery = useCallback(
    async (key: string) => {
      const query = sharedQueries.find((q) => q._key === key)
      if (!query) {
        throw new Error(`No shared query with key "${key}"`)
      }
      const personalKey = await saveQuery({
        shared: false,
        title: query.title,
        url: query.url,
        savedAt: new Date().toISOString(),
      })
      try {
        await deleteSharedQuery(key)
      } catch (err) {
        try {
          await deletePersonalQuery(personalKey)
        } catch {
          throw moveLeftBothCopies(err, 'personal')
        }
        throw err
      }
    },
    [deletePersonalQuery, deleteSharedQuery, saveQuery, sharedQueries],
  )

  const clearQueries = useCallback(
    () =>
      enqueuePersonalWrite(async () => {
        // Nothing disappears from the list until the store confirms the write
        await keyValueStore.setKey(keyValueStoreKey, defaultValue as unknown as KeyValueStoreValue)
        latestQueriesRef.current = defaultValue.queries
        setValue(defaultValue)
      }),
    [enqueuePersonalWrite, keyValueStore],
  )

  return {
    queries,
    saveQuery,
    updateQuery,
    deleteQuery,
    shareQuery,
    unshareQuery,
    clearQueries,
    saving,
    deleting,
    saveQueryError,
    deleteQueryError,
    error,
  }
}
