import {uuid} from '@sanity/uuid' // Import the UUID library
import {useCallback, useEffect, useMemo, useState} from 'react'
import {map, startWith} from 'rxjs/operators'
import {type KeyValueStoreValue, useKeyValueStore} from 'sanity'

const STORED_QUERIES_NAMESPACE = 'studio.vision-tool.saved-queries'

export interface QueryConfig {
  _key: string
  url: string
  savedAt: string
  title?: string
  shared?: boolean
}

export interface StoredQueries {
  queries: QueryConfig[]
}

const defaultValue = {
  queries: [],
}
const keyValueStoreKey = STORED_QUERIES_NAMESPACE

export function useSavedQueries(): {
  queries: QueryConfig[]
  saveQuery: (query: Omit<QueryConfig, '_key'>) => void
  updateQuery: (query: QueryConfig) => void
  deleteQuery: (key: string) => void
  saving: boolean
  deleting: string[]
  saveQueryError: Error | undefined
  deleteQueryError: Error | undefined
  error: Error | undefined
} {
  const keyValueStore = useKeyValueStore()

  const [value, setValue] = useState<StoredQueries>(defaultValue)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string[]>([])
  const [saveQueryError, setSaveQueryError] = useState<Error | undefined>()
  const [deleteQueryError, setDeleteQueryError] = useState<Error | undefined>()
  const [error, setError] = useState<Error | undefined>()

  const queries = useMemo(() => {
    return keyValueStore.getKey(keyValueStoreKey)
  }, [keyValueStore])

  useEffect(() => {
    const sub = queries
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
  }, [queries, keyValueStore])

  const saveQuery = useCallback(
    (query: Omit<QueryConfig, '_key'>) => {
      setSaving(true)
      setSaveQueryError(undefined)
      try {
        const newQuery = {...query, _key: uuid()} // Add a unique _key to the query
        const newQueries = [newQuery, ...value.queries]
        setValue({queries: newQueries})
        keyValueStore.setKey(keyValueStoreKey, {
          queries: newQueries,
        } as unknown as KeyValueStoreValue)
      } catch (err) {
        setSaveQueryError(err as Error)
      } finally {
        setSaving(false)
      }
    },
    [keyValueStore, value.queries],
  )

  const updateQuery = useCallback(
    (query: QueryConfig) => {
      setSaving(true)
      setSaveQueryError(undefined)
      try {
        const updatedQueries = value.queries.map((q) =>
          q._key === query._key ? {...q, ...query} : q,
        )
        setValue({queries: updatedQueries})
        keyValueStore.setKey(keyValueStoreKey, {
          queries: updatedQueries,
        } as unknown as KeyValueStoreValue)
      } catch (err) {
        setSaveQueryError(err as Error)
      } finally {
        setSaving(false)
      }
    },
    [keyValueStore, value.queries],
  )

  const deleteQuery = useCallback(
    (key: string) => {
      setDeleting((prev) => [...prev, key])
      setDeleteQueryError(undefined)
      try {
        const filteredQueries = value.queries.filter((q) => q._key !== key)
        setValue({queries: filteredQueries})
        keyValueStore.setKey(keyValueStoreKey, {
          queries: filteredQueries,
        } as unknown as KeyValueStoreValue)
      } catch (err) {
        setDeleteQueryError(err as Error)
      } finally {
        setDeleting((prev) => prev.filter((k) => k !== key))
      }
    },
    [keyValueStore, value.queries],
  )

  return {
    queries: value.queries,
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
