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
  saveQuery: (query: Omit<QueryConfig, '_key'>) => Promise<void>
  updateQuery: (query: QueryConfig) => Promise<void>
  deleteQuery: (key: string) => Promise<void>
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
            setError(err as Error)
          })
        },
        error: (err) => setError(err as Error),
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

  const saveQuery = useCallback(
    async (query: Omit<QueryConfig, '_key'>) => {
      setSaving(true)
      setSaveQueryError(undefined)

      if (query.shared) {
        if (!currentUser?.id) {
          setSaveQueryError(new Error('No current user found. Unable to save shared query.'))
          setSaving(false)
          return
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
        } catch (err) {
          setSaveQueryError(err as Error)
        }
        setSaving(false)
        return
      }

      try {
        const newQuery = {...query, _key: uuid()} // Add a unique _key to the query
        const newQueries = [newQuery, ...value.queries]
        setValue({queries: newQueries})
        await keyValueStore.setKey(keyValueStoreKey, {
          queries: newQueries,
        } as unknown as KeyValueStoreValue)
      } catch (err) {
        setSaveQueryError(err as Error)
      }
      setSaving(false)
    },
    [currentUser, workspaceClient, keyValueStore, mapSharedQueries, value.queries],
  )

  const updateQuery = useCallback(
    async (query: QueryConfig) => {
      setSaving(true)
      setSaveQueryError(undefined)

      if (query.shared) {
        if (!currentUser?.id || query.authorId !== currentUser.id) {
          setSaveQueryError(new Error('Only the author can update a shared query.'))
          setSaving(false)
          return
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
        } catch (err) {
          setSaveQueryError(err as Error)
        }
        setSaving(false)
        return
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
        setSaveQueryError(err as Error)
      }
      setSaving(false)
    },
    [workspaceClient, currentUser, keyValueStore, mapSharedQueries, value.queries],
  )

  const deleteQuery = useCallback(
    async (key: string) => {
      setDeleting((prev) => [...prev, key])
      setDeleteQueryError(undefined)
      const clearDeleting = () => setDeleting((prev) => prev.filter((k) => k !== key))

      const sharedQuery = sharedQueries.find((query) => query._key === key && query.shared)
      if (sharedQuery) {
        if (!currentUser?.id || sharedQuery.authorId !== currentUser.id) {
          setDeleteQueryError(new Error('Only the author can delete a shared query.'))
          clearDeleting()
          return
        }

        try {
          await workspaceClient.delete(key)
          setSharedQueries((prev) => prev.filter((query) => query._key !== key))
        } catch (err) {
          setDeleteQueryError(err as Error)
        }
        clearDeleting()
        return
      }

      try {
        const filteredQueries = value.queries.filter((q) => q._key !== key)
        setValue({queries: filteredQueries})
        await keyValueStore.setKey(keyValueStoreKey, {
          queries: filteredQueries,
        } as unknown as KeyValueStoreValue)
      } catch (err) {
        setDeleteQueryError(err as Error)
      }
      clearDeleting()
    },
    [workspaceClient, currentUser, keyValueStore, sharedQueries, value.queries],
  )

  return {
    queries,
    saveQuery,
    updateQuery,
    deleteQuery,
    saving,
    deleting,
    saveQueryError,
    deleteQueryError,
    error,
  }
}
