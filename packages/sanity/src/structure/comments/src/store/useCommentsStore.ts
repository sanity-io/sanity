import {useMemo, useEffect, useCallback, useReducer, useState, useRef} from 'react'
import {ListenEvent, ListenOptions, SanityClient} from '@sanity/client'
import {catchError, of} from 'rxjs'
import {CommentDocument, Loadable} from '../types'
import {CommentsReducerAction, CommentsReducerState, commentsReducer} from './reducer'
import {getPublishedId} from 'sanity'

export interface CommentsStoreOptions {
  documentId: string
  client: SanityClient | null
  /**
   * The transaction ID of the latest operation.
   */
  latestTransactions: {commentId: string; transactionId: string}[]
  /**
   * A callback that is called when the latest transaction is received.
   */
  onLatestTransactionReceived: (commentId: string) => void
}

interface CommentsStoreReturnType extends Loadable<CommentDocument[]> {
  dispatch: React.Dispatch<CommentsReducerAction>
}

const INITIAL_STATE: CommentsReducerState = {
  comments: {},
}

const LISTEN_OPTIONS: ListenOptions = {
  events: ['welcome', 'mutation', 'reconnect'],
  includeResult: true,
  visibility: 'query',
}

export const SORT_FIELD = '_createdAt'
export const SORT_ORDER = 'desc'

const QUERY_FILTERS = [`_type == "comment"`, `target.document._ref == $documentId`]

const QUERY_PROJECTION = `{
  _createdAt,
  _id,
  authorId,
  lastEditedAt,
  message,
  parentCommentId,
  status,
  target,
  threadId,
  reactions
}`

// Newest comments first
const QUERY_SORT_ORDER = `order(${SORT_FIELD} ${SORT_ORDER})`

const QUERY = `*[${QUERY_FILTERS.join(' && ')}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`

export function useCommentsStore(opts: CommentsStoreOptions): CommentsStoreReturnType {
  const {client, documentId, latestTransactions, onLatestTransactionReceived} = opts

  const [state, dispatch] = useReducer(commentsReducer, INITIAL_STATE)
  const [loading, setLoading] = useState<boolean>(client !== null)
  const [error, setError] = useState<Error | null>(null)

  const ranInitialFetch = useRef<boolean>(false)

  const params = useMemo(() => ({documentId: getPublishedId(documentId)}), [documentId])

  const initialFetch = useCallback(async () => {
    if (!client) {
      setLoading(false)
      return
    }

    try {
      const res = await client.fetch(QUERY, params)
      dispatch({type: 'COMMENTS_SET', comments: res})
      setLoading(false)
    } catch (err) {
      setError(err)
    }
  }, [client, params])

  const handleListenerEvent = useCallback(
    async (event: ListenEvent<Record<string, CommentDocument>>) => {
      // Fetch all comments on initial connection
      if (event.type === 'welcome' && !ranInitialFetch.current) {
        setLoading(true)
        await initialFetch()
        ranInitialFetch.current = true
        setLoading(false)
      }

      // The reconnect event means that we are trying to reconnect to the realtime listener.
      // In this case we set loading to true to indicate that we're trying to
      // reconnect. Once a connection has been established, the welcome event
      // will be received and we'll fetch all comments again (above).
      if (event.type === 'reconnect') {
        setLoading(true)
        ranInitialFetch.current = false
      }

      // Handle mutations (create, update, delete) from the realtime listener
      // and update the comments store accordingly
      if (event.type === 'mutation') {
        if (event.transition === 'appear') {
          const nextComment = event.result as CommentDocument | undefined

          if (nextComment) {
            dispatch({
              type: 'COMMENT_RECEIVED',
              payload: nextComment,
            })
          }
        }

        if (event.transition === 'disappear') {
          dispatch({type: 'COMMENT_DELETED', id: event.documentId})
        }

        if (event.transition === 'update') {
          const updatedComment = event.result as CommentDocument | undefined
          const commentId = (updatedComment?._id || '') as string
          const latestTransactionId = latestTransactions.find((t) => t.commentId === commentId)
            ?.transactionId
          const isLatestTransactionId = event.transactionId === latestTransactionId

          // If there's a latestTransactionId set, we only want to update the comment
          // if the transactionId of the event matches the latestTransactionId.
          // This is to avoid updating the comment with an old transactionId.
          if (!isLatestTransactionId && latestTransactionId) return

          if (updatedComment) {
            dispatch({
              type: 'COMMENT_UPDATED',
              payload: updatedComment,
            })

            onLatestTransactionReceived(commentId)
          }
        }
      }
    },
    [initialFetch, onLatestTransactionReceived, latestTransactions],
  )

  const listener$ = useMemo(() => {
    if (!client) return of()

    const events$ = client.observable.listen(QUERY, params, LISTEN_OPTIONS).pipe(
      catchError((err) => {
        setError(err)
        return of(err)
      }),
    )

    return events$
  }, [client, params])

  useEffect(() => {
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
