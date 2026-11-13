import {type SanityClient} from '@sanity/client'
import {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react'
import {catchError, EMPTY} from 'rxjs'

import {type ReleaseId} from '../../perspective/types'
import {
  type AddonDatasetDocument,
  type AddonDatasetListenerEvent,
  type AddonDatasetListenerStore,
} from '../../store/addonDatasetListener/createAddonDatasetListenerStore'
import {getPublishedId} from '../../util/draftUtils'
import {type CommentDocument, type Loadable} from '../types'
import {commentsReducer, type CommentsReducerAction, type CommentsReducerState} from './reducer'

type DocumentId = string
type TransactionId = string

export interface CommentsStoreOptions {
  client: SanityClient | null
  /**
   * The shared listener on the addon dataset, `null` while the workspace has none
   */
  listenerStore: AddonDatasetListenerStore | null
  documentId: string
  onLatestTransactionIdReceived: (documentId: DocumentId) => void
  transactionsIdMap: Map<DocumentId, TransactionId>
  releaseId?: ReleaseId
}

interface CommentsStoreReturnType extends Loadable<CommentDocument[]> {
  dispatch: React.Dispatch<CommentsReducerAction>
}

const INITIAL_STATE: CommentsReducerState = {
  comments: {},
}

const SORT_FIELD = '_createdAt'

const SORT_ORDER = 'desc'

const QUERY_FILTERS = [`_type == "comment"`, `target.document._ref == $documentId`]
const VERSION_FILTER = `target.documentVersionId==$documentVersionId`
const NO_VERSION_FILTER = `!defined(target.documentVersionId)`

const QUERY_PROJECTION = `{
  _createdAt,
  _id,
  authorId,
  contentSnapshot,
  context,
  lastEditedAt,
  message,
  parentCommentId,
  reactions,
  status,
  target,
  threadId
}`

// Newest comments first
const QUERY_SORT_ORDER = `order(${SORT_FIELD} ${SORT_ORDER})`

/**
 * Whether a document from the shared listener is one of the comments the store's query reads:
 * the same filters, applied to the document.
 */
function isCommentInQuery(
  document: AddonDatasetDocument,
  options: {publishedId: string; releaseId?: ReleaseId},
): boolean {
  if (document._type !== 'comment' || document.target?.document?._ref !== options.publishedId) {
    return false
  }

  return options.releaseId
    ? document.target.documentVersionId === options.releaseId
    : document.target.documentVersionId === undefined
}

export function useCommentsStore(opts: CommentsStoreOptions): CommentsStoreReturnType {
  const {
    client,
    listenerStore,
    documentId,
    onLatestTransactionIdReceived,
    transactionsIdMap,
    releaseId,
  } = opts

  const filters = [...QUERY_FILTERS, releaseId ? VERSION_FILTER : NO_VERSION_FILTER].join(' && ')
  const query = useMemo(() => `*[${filters}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`, [filters])

  const [state, dispatch] = useReducer(commentsReducer, INITIAL_STATE)
  const [loading, setLoading] = useState<boolean>(client !== null)
  const [error, setError] = useState<Error | null>(null)

  const didInitialFetch = useRef<boolean>(false)

  const publishedId = getPublishedId(documentId)
  const params = useMemo(
    () => ({
      documentId: publishedId,
      ...(releaseId ? {documentVersionId: releaseId} : {}),
    }),
    [publishedId, releaseId],
  )

  const initialFetch = useCallback(async () => {
    if (!client) {
      setLoading(false)
      return
    }

    try {
      const res = await client.fetch(query, params)
      dispatch({type: 'COMMENTS_SET', comments: res})
      setLoading(false)
    } catch (err) {
      setError(err)
    }
  }, [client, params, query])

  const handleListenerEvent = useCallback(
    async (event: AddonDatasetListenerEvent) => {
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

        const document = event.result
        if (!document || document._type !== 'comment') return

        // The shared listener reports every comment and task in the addon dataset. One that is
        // not in this store's query, or no longer is after an edit, is dropped if the store had it.
        if (!isCommentInQuery(document, {publishedId, releaseId})) {
          dispatch({type: 'COMMENT_DELETED', id: document._id})
          return
        }

        if (event.transition === 'appear') {
          dispatch({
            type: 'COMMENT_RECEIVED',
            payload: document,
          })
        }

        if (event.transition === 'update') {
          const id = document._id
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
            payload: document,
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
    [initialFetch, onLatestTransactionIdReceived, publishedId, releaseId, transactionsIdMap],
  )

  const listener$ = useMemo(() => {
    if (!listenerStore) return EMPTY

    return listenerStore.events.pipe(
      catchError((err) => {
        setError(err)
        return EMPTY
      }),
    )
  }, [listenerStore])

  useEffect(() => {
    // The shared listener replays its `welcome` to every new subscription, so a resubscription
    // for a different document or release fetches that one's comments.
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
