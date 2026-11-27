import {type ListenOptions} from '@sanity/client'
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
  url,
  query,
  params
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
  /**
   * The query and params a shared query's collaborators have edited it to, ahead of its `url`,
   * which is rebuilt as they edit but only while the params parse. Absent on one shared before
   * tabs were edited together.
   */
  query?: string
  rawParams?: string
}

/** The fields of a shared query its collaborators edit together */
export interface SharedQueryFields {
  query: string
  rawParams: string
  /** The tab's options, as `toStoredOptions` stores them */
  options: Record<string, unknown>
}

/** What a shared query is created with: the tab's request, and the fields edited together */
export type SharedQueryInit = Pick<QueryConfig, 'url' | 'title' | 'savedAt'> & SharedQueryFields

interface SharedQueryDocument {
  _id: string
  _type?: string
  authorId: string
  savedAt: string
  title?: string
  url: string
  query?: unknown
  params?: unknown
  options?: unknown
}

/**
 * The shared queries, which tabs are shared as, and the personal queries saved in the classic
 * tool, which open as tabs once. Nothing writes to the personal queries.
 */
export function useSavedQueries(): {
  queries: QueryConfig[]
  /** Whether the shared queries have been fetched, so one missing from the list is not shared */
  sharedQueriesLoaded: boolean
  /** Creates a shared query, and resolves with its document id */
  shareQuery: (query: SharedQueryInit) => Promise<string>
  /**
   * Replaces what a shared query the current user authored holds, and with `fields` the query,
   * params and options edited together too
   */
  updateSharedQuery: (query: QueryConfig, fields?: SharedQueryFields) => Promise<void>
  /** Deletes a shared query the current user authored; rejects when that fails */
  unshareQuery: (key: string) => Promise<void>
  saving: boolean
  error: Error | undefined
} {
  const {items: personalItems, error: personalError} = useStudioPreferenceList(
    'studio.vision-tool.saved-queries',
  )
  const workspaceClient = useClient({apiVersion: DEFAULT_API_VERSION})
  const currentUser = useCurrentUser()

  const [sharedQueries, setSharedQueries] = useState<QueryConfig[]>([])
  const [sharedQueriesLoaded, setSharedQueriesLoaded] = useState(false)
  // Shares and updates may overlap, so `saving` is derived from how many are in flight rather
  // than cleared by whichever one settles first
  const [pendingSaves, setPendingSaves] = useState(0)
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
        query: typeof doc.query === 'string' ? doc.query : undefined,
        rawParams: typeof doc.params === 'string' ? doc.params : undefined,
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

  /** Runs a share or update as one of the saves in flight, which `saving` holds until all settle */
  const runSave = useCallback(<T>(task: () => Promise<T>): Promise<T> => {
    setPendingSaves((count) => count + 1)
    return task().finally(() => setPendingSaves((count) => count - 1))
  }, [])

  const shareQuery = useCallback(
    (query: SharedQueryInit): Promise<string> =>
      runSave(async () => {
        if (!currentUser?.id) {
          throw new Error('No current user found. Unable to save shared query.')
        }
        const createdDoc = (await workspaceClient.create({
          _type: SHARED_QUERY_DOCUMENT_TYPE,
          authorId: currentUser.id,
          savedAt: query.savedAt,
          title: query.title,
          url: query.url,
          query: query.query,
          params: query.rawParams,
          options: query.options,
        })) as SharedQueryDocument
        setSharedQueries((prev) => [...mapSharedQueries([createdDoc]), ...prev])
        return createdDoc._id
      }),
    [currentUser, workspaceClient, mapSharedQueries, runSave],
  )

  const updateSharedQuery = useCallback(
    (query: QueryConfig, fields?: SharedQueryFields): Promise<void> =>
      runSave(async () => {
        if (!query.shared || !currentUser?.id || query.authorId !== currentUser.id) {
          throw new Error('Only the author can update a shared query.')
        }
        const updatedDoc = (await workspaceClient
          .patch(query._key)
          .set({
            savedAt: query.savedAt,
            title: query.title,
            url: query.url,
            ...(fields && {query: fields.query, params: fields.rawParams, options: fields.options}),
          })
          .commit()) as SharedQueryDocument

        const [updatedSharedQuery] = mapSharedQueries([updatedDoc])
        setSharedQueries((prev) =>
          prev.map((existingQuery) =>
            existingQuery._key === query._key ? updatedSharedQuery : existingQuery,
          ),
        )
      }),
    [workspaceClient, currentUser, mapSharedQueries, runSave],
  )

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

  return {
    queries,
    sharedQueriesLoaded,
    shareQuery,
    updateSharedQuery,
    unshareQuery,
    saving: pendingSaves > 0,
    error: error ?? (personalError instanceof Error ? personalError : undefined),
  }
}
