import {
  type CollaborationCommentDocument,
  type MutationEvent,
  type SanityClient,
} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable, useObservableSubject} from 'react-rx'
import {distinctUntilChanged, filter, map, merge, type Observable, of, scan, tap} from 'rxjs'

import {
  followListenerQuery,
  type ListenerQueryEvent,
  type ListenerQueryStatusEvent,
} from '../../store/sharedListener/followListenerQuery'
import {getPublishedId, isDraftId} from '../../util/draftUtils'
import {type CommentDocument, type CommentsType, type Loadable} from '../types'
import {buildCommentsQuery, matchesCommentsQuery} from './buildCommentsQuery'
import {type CommentsApiListenerStore} from './createCommentsApiListenerStore'
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

interface CommentsStoreState extends CommentsReducerState {
  loading: boolean
  error: Error | null
}

type CommentsStoreAction = CommentsReducerAction | ListenerQueryStatusEvent

const LOADING_STATE: CommentsStoreState = {comments: {}, loading: true, error: null}
const IDLE_STATE: CommentsStoreState = {comments: {}, loading: false, error: null}

interface CommentsQueryScope {
  gdr: string | null
  versionId: string
  type: CommentsType
}

interface QueryEventOutcome {
  action: CommentsStoreAction
  /**
   * The comment whose latest locally started transaction this event carries, if any
   */
  latestTransactionReceivedFor: DocumentId | null
}

/**
 * The store action for a mutation from the realtime listener, or `null` when it does not concern
 * the store.
 */
function mutationToOutcome(
  event: MutationEvent<CollaborationCommentDocument>,
  scope: CommentsQueryScope,
  transactionsIdMap: Map<DocumentId, TransactionId>,
): QueryEventOutcome | null {
  if (event.transition === 'disappear') {
    return {
      action: {type: 'COMMENT_DELETED', id: event.documentId},
      latestTransactionReceivedFor: null,
    }
  }

  const comment = event.result as CommentDocument | undefined
  if (!comment) return null

  // The shared listener reports every comment on the resource. One that is not in this
  // store's query, or no longer is after an edit, is dropped if the store had it.
  if (!matchesCommentsQuery(comment, scope)) {
    return {
      action: {type: 'COMMENT_DELETED', id: comment._id},
      latestTransactionReceivedFor: null,
    }
  }

  const latestTransactionId = transactionsIdMap.get(comment._id)

  if (event.transition === 'appear') {
    // A registered transaction for this comment means a local update was
    // issued after it was created (e.g. re-anchoring an inline comment
    // right after creating it). This create echo predates that update, so
    // applying it would clobber the optimistic state with a stale
    // snapshot. Skip it — the update echo carries the fresh one.
    if (latestTransactionId && event.transactionId !== latestTransactionId) return null

    return {
      action: {type: 'COMMENT_RECEIVED', payload: comment},
      latestTransactionReceivedFor: null,
    }
  }

  const isLatestTransaction = event.transactionId === latestTransactionId

  // If we have a transaction id stored for the received comment id, but the
  // received transaction id is not the latest, we don't want to update the
  // comment in the store. This is to avoid that the UI is updated with an old
  // transaction id when multiple transactions are started in a short time span.
  if (!isLatestTransaction && latestTransactionId) return null

  return {
    action: {type: 'COMMENT_UPDATED', payload: comment},
    latestTransactionReceivedFor: isLatestTransaction ? comment._id : null,
  }
}

/**
 * The store action for an event of the comments query, or `null` when it does not concern the
 * store.
 */
function queryEventToOutcome(
  event: ListenerQueryEvent<CommentDocument, CollaborationCommentDocument>,
  scope: CommentsQueryScope,
  transactionsIdMap: Map<DocumentId, TransactionId>,
): QueryEventOutcome | null {
  switch (event.type) {
    case 'loading':
    case 'error':
      return {action: event, latestTransactionReceivedFor: null}
    case 'loaded':
      return {
        action: {type: 'COMMENTS_SET', comments: event.documents},
        latestTransactionReceivedFor: null,
      }
    case 'mutation':
      return mutationToOutcome(event, scope, transactionsIdMap)
    default: {
      const unhandled: never = event
      return unhandled
    }
  }
}

/**
 * Applies `commentsReducer` to the comments, and returns `state` itself when nothing changed so
 * the consumers' data keeps its identity.
 */
function commentsStoreReducer(
  state: CommentsStoreState,
  action: CommentsStoreAction,
): CommentsStoreState {
  switch (action.type) {
    case 'loading':
      return state.loading ? state : {...state, loading: true}
    case 'error':
      return {...state, error: action.error, loading: false}
    case 'COMMENTS_SET':
      return {
        ...state,
        comments: commentsReducer(state, action).comments,
        loading: false,
        error: null,
      }
    case 'COMMENT_ADDED':
    case 'COMMENT_DELETED':
    case 'COMMENT_RECEIVED':
    case 'COMMENT_UPDATED': {
      const {comments} = commentsReducer(state, action)
      return comments === state.comments ? state : {...state, comments}
    }
    default: {
      const unhandled: never = action
      return unhandled
    }
  }
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

  const gdr = useMemo(
    () => client?.collaboration.comments.getTargetDocumentRef(groupId) ?? null,
    [client, groupId],
  )
  const enabled = Boolean(client && listenerStore && gdr && ready)
  // Draft and published share one comments query, so switching between them keeps the subscription
  const scopeVersionId = isDraftId(versionId) ? getPublishedId(versionId) : versionId

  // Optimistic updates from the comment operations
  const [localActions$, dispatch] = useObservableSubject<CommentsReducerAction>()

  // One subscription per query scope: changing it (e.g. draft and published to a version) tears
  // the previous one down, which cancels its fetch, and the shared listener replays its `welcome`
  // to the new one, which fetches again.
  const state$: Observable<CommentsStoreState> = useMemo(() => {
    if (!client || !listenerStore || !gdr || !ready) return of(IDLE_STATE)

    const scope: CommentsQueryScope = {gdr, versionId: scopeVersionId, type}
    const {query, params} = buildCommentsQuery(scope)

    const fetchComments = client.observable.collaboration.comments.fetch<CommentDocument[]>(
      query,
      params,
    )
    const remoteActions$ = listenerStore.events.pipe(
      followListenerQuery(fetchComments),
      map((event) => queryEventToOutcome(event, scope, transactionsIdMap)),
      filter((outcome) => outcome !== null),
      tap(({latestTransactionReceivedFor}) => {
        // Let the consumer know that the latest transaction it started has been received
        if (latestTransactionReceivedFor) {
          onLatestTransactionIdReceived(latestTransactionReceivedFor)
        }
      }),
      map(({action}) => action),
    )

    return merge(remoteActions$, localActions$).pipe(
      scan(commentsStoreReducer, LOADING_STATE),
      distinctUntilChanged(),
    )
  }, [
    client,
    gdr,
    listenerStore,
    localActions$,
    onLatestTransactionIdReceived,
    ready,
    scopeVersionId,
    transactionsIdMap,
    type,
  ])

  // The first render after the scope changes shows the initial value, until the new subscription
  // emits. That is the loading state, unless the store is not following a query at all.
  const subscribedState = useObservable(state$, LOADING_STATE)
  const state = enabled ? subscribedState : IDLE_STATE

  // Transform comments object to array
  const commentsAsArray = useMemo(() => Object.values(state.comments), [state.comments])

  return {
    data: commentsAsArray,
    dispatch,
    error: state.error,
    loading: state.loading,
  }
}
