import {type SanityClient} from '@sanity/client'
import {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react'
import {catchError, EMPTY} from 'rxjs'

import {type CommentDocument, type CommentsType, type Loadable} from '../types'
import {buildCommentsQuery, matchesCommentsQuery} from './buildCommentsQuery'
import {
  type CommentsApiListenerEvent,
  type CommentsApiListenerStore,
} from './createCommentsApiListenerStore'
import {commentsReducer, type CommentsReducerAction, type CommentsReducerState} from './reducer'

type DocumentId = string
type TransactionId = string

export interface CommentsStoreOptions {
  /**
   * Sanity client configured with `collaboration.organizationId` for the Comments API.
   */
  client: SanityClient | null
  /**
   * The shared Comments API listener on the resource of `client`, `null` without a client.
   */
  listenerStore: CommentsApiListenerStore | null
  /**
   * Published / group id. Used for the comments GDR.
   */
  groupId: string
  /**
   * Exact document in the editor. Drives which comments are listed.
   */
  versionId: string
  /**
   * Field comments require a path; task comments are document-level.
   */
  type: CommentsType
  onLatestTransactionIdReceived: (documentId: DocumentId) => void
  transactionsIdMap: Map<DocumentId, TransactionId>
  /**
   * When false, skip listen/fetch (version/variant scope still resolving).
   * Defaults to true.
   */
  ready?: boolean
}

interface CommentsStoreReturnType extends Loadable<CommentDocument[]> {
  dispatch: React.Dispatch<CommentsReducerAction>
}

const INITIAL_STATE: CommentsReducerState = {
  comments: {},
}

export function useCommentsStore(opts: CommentsStoreOptions): CommentsStoreReturnType {
  const {
    client,
    listenerStore,
    groupId,
    versionId,
    type,
    onLatestTransactionIdReceived,
    transactionsIdMap,
    ready = true,
  } = opts

  const [state, dispatch] = useReducer(commentsReducer, INITIAL_STATE)
  const [loading, setLoading] = useState<boolean>(client !== null && ready)
  const [error, setError] = useState<Error | null>(null)

  const didInitialFetch = useRef<boolean>(false)

  const gdr = useMemo(
    () => client?.collaboration.comments.getTargetDocumentRef(groupId) ?? null,
    [client, groupId],
  )

  const {query, params} = useMemo(
    () => buildCommentsQuery({gdr, versionId, type}),
    [gdr, versionId, type],
  )

  // When the query scope changes (e.g. draft+published → version), drop stale
  // results during render. The listen effect below resets fetch tracking when
  // it resubscribes.
  const queryKey = `${query}:${JSON.stringify(params)}:${ready}`
  const [activeQueryKey, setActiveQueryKey] = useState(queryKey)

  if (activeQueryKey !== queryKey) {
    setActiveQueryKey(queryKey)
    dispatch({type: 'COMMENTS_SET', comments: []})
    setLoading(Boolean(client && gdr && ready))
    setError(null)
  }

  const initialFetch = useCallback(async () => {
    if (!client || !gdr || !ready) {
      setLoading(false)
      return
    }

    try {
      const res = await client.collaboration.comments.fetch<CommentDocument[]>(query, params)
      dispatch({type: 'COMMENTS_SET', comments: res})
      setError(null)
      setLoading(false)
    } catch (err) {
      setError(err)
    }
  }, [client, gdr, ready, params, query])

  const handleListenerEvent = useCallback(
    async (event: CommentsApiListenerEvent) => {
      // Fetch all comments on initial connection
      if (event.type === 'welcome' && !didInitialFetch.current) {
        setLoading(true)
        await initialFetch()
        setLoading(false)
        didInitialFetch.current = true
      }

      // The reconnect event means that we are trying to reconnect to the realtime listener.
      // In this case we set loading to true to indicate that we're trying to
      // reconnect. Once a connection has been established, the welcome event
      // will be received and we'll fetch all comments again (above)
      if (event.type === 'reconnect') {
        setLoading(true)
        didInitialFetch.current = false
      }

      // Handle mutations (create, update, delete) from the realtime listener
      // and update the comments store accordingly
      if (event.type === 'mutation') {
        if (event.transition === 'disappear') {
          dispatch({type: 'COMMENT_DELETED', id: event.documentId})
          return
        }

        // The shared listener reports every comment on the resource. One that is not in this
        // store's query, or no longer is after an edit, is dropped if the store had it.
        const comment = event.result as CommentDocument | undefined
        if (!comment) return

        if (!matchesCommentsQuery(comment, {gdr, versionId, type})) {
          dispatch({type: 'COMMENT_DELETED', id: comment._id})
          return
        }

        if (event.transition === 'appear') {
          // A registered transaction for this comment means a local update was
          // issued after it was created (e.g. re-anchoring an inline comment
          // right after creating it). This create echo predates that update, so
          // applying it would clobber the optimistic state with a stale
          // snapshot. Skip it — the update echo carries the fresh one.
          const latestTransactionId = transactionsIdMap.get(comment._id)
          const isStale = latestTransactionId && event.transactionId !== latestTransactionId
          if (isStale) return

          dispatch({
            type: 'COMMENT_RECEIVED',
            payload: comment,
          })
        }

        if (event.transition === 'update') {
          const id = comment._id
          const transactionId = event.transactionId
          const latestTransactionId = transactionsIdMap.get(id)
          const isLatestTransaction = transactionId === latestTransactionId

          // If we have a transaction id stored for the received comment id, but the
          // received transaction id is not the latest, we don't want to update the
          // comment in the store. This is to avoid that the UI is updated with an old
          // transaction id when multiple transactions are started in a short time span.
          if (!isLatestTransaction && latestTransactionId) return

          dispatch({
            type: 'COMMENT_UPDATED',
            payload: comment,
          })

          // If the received transaction id is the latest, we'll call the
          // `onLatestTransactionIdReceived` callback to let the parent consumer
          // know that the transaction id has been received.
          if (isLatestTransaction) {
            onLatestTransactionIdReceived(id)
          }
        }
      }
    },
    [gdr, initialFetch, onLatestTransactionIdReceived, transactionsIdMap, type, versionId],
  )

  const listener$ = useMemo(() => {
    if (!listenerStore || !gdr || !ready) return EMPTY

    return listenerStore.events.pipe(
      catchError((err) => {
        setError(err)
        return EMPTY
      }),
    )
  }, [listenerStore, gdr, ready])

  useEffect(() => {
    // The shared listener replays its `welcome` to every new subscription, so a resubscription
    // for a different query fetches that one's comments.
    didInitialFetch.current = false
    const sub = listener$.subscribe(handleListenerEvent)

    return () => {
      sub?.unsubscribe()
    }
  }, [handleListenerEvent, listener$])

  // Transform comments object to array
  const commentsAsArray = useMemo(() => Object.values(state.comments), [state.comments])

  return {
    data: commentsAsArray,
    dispatch,
    error,
    loading,
  }
}
