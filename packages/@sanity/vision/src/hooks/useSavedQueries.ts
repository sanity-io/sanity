import {type ListenOptions} from '@sanity/client'
import {uuid} from '@sanity/uuid' // Import the UUID library
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
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
  /** Keys of the queries a share or unshare is moving right now */
  moving: string[]
  saveQueryError: Error | undefined
  deleteQueryError: Error | undefined
  error: Error | undefined
} {
  const {
    items: personalItems,
    error: personalError,
    set: setPersonalQuery,
  } = useStudioPreferenceList('studio.vision-tool.saved-queries')
  const workspaceClient = useClient({apiVersion: DEFAULT_API_VERSION})
  const currentUser = useCurrentUser()

  const [sharedQueries, setSharedQueries] = useState<QueryConfig[]>([])
  // Saves and updates may overlap (a share's save next to a user's own), so `saving` is derived
  // from how many are in flight rather than cleared by whichever one settles first
  const [pendingSaves, setPendingSaves] = useState(0)
  const [deleting, setDeleting] = useState<string[]>([])
  const [moving, setMoving] = useState<string[]>([])
  const [saveQueryError, setSaveQueryError] = useState<Error | undefined>()
  const [deleteQueryError, setDeleteQueryError] = useState<Error | undefined>()
  const [error, setError] = useState<Error | undefined>()

  // The moves in progress, by the key of the query being moved. A move copies the query first
  // and removes the original last, so until it settles the original is still there to be moved
  // again; a second share or unshare of it joins the pending move instead of making another copy
  const movesRef = useRef(new Map<string, Promise<void>>())

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
        await setPersonalQuery(newQuery._key, newQuery)
        return newQuery._key
      }),
    [currentUser, workspaceClient, mapSharedQueries, runSave, setPersonalQuery],
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

  /**
   * Runs `move` for `key` unless one is pending already, in which case that one is returned. The
   * move reports the copy it makes in the other list through `alsoMoving`: that copy shows up
   * before the original is removed, and is moving (a second move of it joins this one, and the
   * lists offer it no actions) until the move settles, since a failure takes it back.
   */
  const runMove = useCallback(
    (key: string, move: (alsoMoving: (copyKey: string) => void) => Promise<void>) => {
      const pending = movesRef.current.get(key)
      if (pending) {
        return pending
      }
      const keys = new Set([key])
      const alsoMoving = (copyKey: string) => {
        const thisMove = movesRef.current.get(key)
        if (thisMove) movesRef.current.set(copyKey, thisMove)
        keys.add(copyKey)
        setMoving((prev) => [...prev, copyKey])
      }
      setMoving((prev) => [...prev, key])
      const result = move(alsoMoving).finally(() => {
        for (const moved of keys) movesRef.current.delete(moved)
        setMoving((prev) => prev.filter((moved) => !keys.has(moved)))
      })
      movesRef.current.set(key, result)
      return result
    },
    [],
  )

  // Moving a query between the personal store and the shared documents takes two writes to two
  // stores, so it cannot be atomic. When the second write fails, the first is taken back so the
  // query does not end up in both places and a retry cannot pile up copies; the move then rejects
  // with the original error. Should taking it back fail as well, both copies stay in the lists,
  // as they do in the stores, and the error says so.
  const shareQuery = useCallback(
    (key: string) =>
      runMove(key, async (alsoMoving) => {
        const query = personalQueries.find((q) => q._key === key)
        if (!query) {
          throw new Error(`No personal saved query with key "${key}"`)
        }
        const sharedKey = await saveQuery({
          shared: true,
          title: query.title,
          url: query.url,
          savedAt: new Date().toISOString(),
        })
        alsoMoving(sharedKey)
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
      }),
    [deletePersonalQuery, personalQueries, runMove, saveQuery, workspaceClient],
  )

  const unshareQuery = useCallback(
    (key: string) =>
      runMove(key, async (alsoMoving) => {
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
        alsoMoving(personalKey)
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
      }),
    [deletePersonalQuery, deleteSharedQuery, runMove, saveQuery, sharedQueries],
  )

  const clearQueries = useCallback(async () => {
    await Promise.all(personalQueries.map((query) => deletePersonalQuery(query._key)))
  }, [deletePersonalQuery, personalQueries])

  return {
    queries,
    saveQuery,
    updateQuery,
    deleteQuery,
    shareQuery,
    unshareQuery,
    clearQueries,
    saving: pendingSaves > 0,
    deleting,
    moving,
    saveQueryError,
    deleteQueryError,
    error: error ?? (personalError instanceof Error ? personalError : undefined),
  }
}
