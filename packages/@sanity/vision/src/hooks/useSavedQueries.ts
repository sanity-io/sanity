import {type ListenOptions} from '@sanity/client'
import {uuid} from '@sanity/uuid' // Import the UUID library
import {useCallback, useEffect, useMemo, useState} from 'react'
import {map, startWith} from 'rxjs/operators'
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
    const sub = personalQueries
      .pipe(
        startWith(defaultValue as any),
        map((data: StoredQueries) => {
          if (!data) {
            return defaultValue
          }
          return data
        }),
      )
      .subscribe({
        next: setValue,
        error: (err) => setError(err as Error),
      })

    return () => sub?.unsubscribe()
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
        const newQueries = [newQuery, ...value.queries]
        setValue({queries: newQueries})
        await keyValueStore.setKey(keyValueStoreKey, {
          queries: newQueries,
        } as unknown as KeyValueStoreValue)
      } catch (err) {
        const saveError = err instanceof Error ? err : new Error(String(err))
        setSaveQueryError(saveError)
        setSaving(false)
        throw saveError
      }
      setSaving(false)
      return newQuery._key
    },
    [currentUser, workspaceClient, keyValueStore, mapSharedQueries, value.queries],
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
        const updatedQueries = value.queries.map((q) =>
          q._key === query._key ? {...q, ...query} : q,
        )
        setValue({queries: updatedQueries})
        await keyValueStore.setKey(keyValueStoreKey, {
          queries: updatedQueries,
        } as unknown as KeyValueStoreValue)
      } catch (err) {
        const updateError = err instanceof Error ? err : new Error(String(err))
        setSaveQueryError(updateError)
        setSaving(false)
        throw updateError
      }
      setSaving(false)
    },
    [workspaceClient, currentUser, keyValueStore, mapSharedQueries, value.queries],
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
      const queriesBefore = value.queries
      const filteredQueries = queriesBefore.filter((q) => q._key !== key)
      setValue({queries: filteredQueries})
      try {
        await keyValueStore.setKey(keyValueStoreKey, {
          queries: filteredQueries,
        } as unknown as KeyValueStoreValue)
      } catch (err) {
        // The store still holds the query, so the list shows it again
        setValue({queries: queriesBefore})
        throw err
      }
    },
    [keyValueStore, value.queries],
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

  // Moving a query between the personal store and the shared documents takes two writes. When
  // the second one fails, the first is taken back so the query is never in both places and a
  // retry cannot pile up copies; the move then rejects with the original error.
  const shareQuery = useCallback(
    async (key: string) => {
      const query = value.queries.find((q) => q._key === key)
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
        setSharedQueries((prev) => prev.filter((q) => q._key !== sharedKey))
        await workspaceClient.delete(sharedKey).catch(() => undefined)
        throw err
      }
    },
    [deletePersonalQuery, saveQuery, value.queries, workspaceClient],
  )

  const unshareQuery = useCallback(
    async (key: string) => {
      const query = sharedQueries.find((q) => q._key === key)
      if (!query) {
        throw new Error(`No shared query with key "${key}"`)
      }
      const personalQueriesBefore = value.queries
      await saveQuery({
        shared: false,
        title: query.title,
        url: query.url,
        savedAt: new Date().toISOString(),
      })
      try {
        await deleteSharedQuery(key)
      } catch (err) {
        setValue({queries: personalQueriesBefore})
        await keyValueStore
          .setKey(keyValueStoreKey, {
            queries: personalQueriesBefore,
          } as unknown as KeyValueStoreValue)
          .catch(() => undefined)
        throw err
      }
    },
    [deleteSharedQuery, keyValueStore, saveQuery, sharedQueries, value.queries],
  )

  const clearQueries = useCallback(async () => {
    // Nothing disappears from the list until the store confirms the write
    await keyValueStore.setKey(keyValueStoreKey, defaultValue as unknown as KeyValueStoreValue)
    setValue(defaultValue)
  }, [keyValueStore])

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
