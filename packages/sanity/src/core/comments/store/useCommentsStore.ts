import {
  type MutationEvent,
  type ReconnectEvent,
  type SanityClient,
  type WelcomeEvent,
} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable, useObservableSubject} from 'react-rx'
import {
  catchError,
  connect,
  distinctUntilChanged,
  filter,
  map,
  merge,
  type Observable,
  of,
  scan,
  startWith,
  switchMap,
  tap,
} from 'rxjs'

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

interface CommentsStoreState extends CommentsReducerState {
  loading: boolean
  error: Error | null
}

type CommentsStoreAction = CommentsReducerAction | {type: 'LOADING'} | {type: 'ERROR'; error: Error}

const LOADING_STATE: CommentsStoreState = {comments: {}, loading: true, error: null}
const IDLE_STATE: CommentsStoreState = {comments: {}, loading: false, error: null}
const LOADING: CommentsStoreAction = {type: 'LOADING'}

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

function getCommentsQuery(releaseId: ReleaseId | undefined): string {
  const filters = [...QUERY_FILTERS, releaseId ? VERSION_FILTER : NO_VERSION_FILTER].join(' && ')
  return `*[${filters}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`
}

interface CommentsQueryScope {
  publishedId: string
  releaseId?: ReleaseId
}

/**
 * Whether a document from the shared listener is one of the comments the store's query reads:
 * the same filters, applied to the document.
 */
function isCommentInQuery(document: AddonDatasetDocument, scope: CommentsQueryScope): boolean {
  if (document._type !== 'comment' || document.target?.document?._ref !== scope.publishedId) {
    return false
  }

  return scope.releaseId
    ? document.target.documentVersionId === scope.releaseId
    : document.target.documentVersionId === undefined
}

function isConnectionEvent(
  event: AddonDatasetListenerEvent,
): event is WelcomeEvent | ReconnectEvent {
  return event.type === 'welcome' || event.type === 'reconnect'
}

function isMutationEvent(
  event: AddonDatasetListenerEvent,
): event is MutationEvent<AddonDatasetDocument> {
  return event.type === 'mutation'
}

interface MutationOutcome {
  action: CommentsReducerAction
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
  event: MutationEvent<AddonDatasetDocument>,
  scope: CommentsQueryScope,
  transactionsIdMap: Map<DocumentId, TransactionId>,
): MutationOutcome | null {
  if (event.transition === 'disappear') {
    return {
      action: {type: 'COMMENT_DELETED', id: event.documentId},
      latestTransactionReceivedFor: null,
    }
  }

  const document = event.result
  if (!document || document._type !== 'comment') return null

  // The shared listener reports every comment and task in the addon dataset. One that is
  // not in this store's query, or no longer is after an edit, is dropped if the store had it.
  if (!isCommentInQuery(document, scope)) {
    return {
      action: {type: 'COMMENT_DELETED', id: document._id},
      latestTransactionReceivedFor: null,
    }
  }

  if (event.transition === 'appear') {
    return {
      action: {type: 'COMMENT_RECEIVED', payload: document},
      latestTransactionReceivedFor: null,
    }
  }

  const latestTransactionId = transactionsIdMap.get(document._id)
  const isLatestTransaction = event.transactionId === latestTransactionId

  // If we have a transaction id stored for the received comment id, but the
  // received transaction id is not the latest, we don't want to update the
  // comment in the store. This is to avoid that the UI is updated with an old
  // transaction id when multiple transactions are started in a short time span.
  if (!isLatestTransaction && latestTransactionId) return null

  return {
    action: {type: 'COMMENT_UPDATED', payload: document},
    latestTransactionReceivedFor: isLatestTransaction ? document._id : null,
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
    case 'LOADING':
      return state.loading ? state : {...state, loading: true}
    case 'ERROR':
      return {...state, error: action.error, loading: false}
    case 'COMMENTS_SET':
      return {...state, comments: commentsReducer(state, action).comments, loading: false}
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
    documentId,
    onLatestTransactionIdReceived,
    transactionsIdMap,
    releaseId,
  } = opts

  const publishedId = getPublishedId(documentId)

  // Optimistic updates from the comment operations
  const [localActions$, dispatch] = useObservableSubject<CommentsReducerAction>()

  // One subscription per document and release: switching either tears it down, which cancels its
  // fetch, and the shared listener replays its `welcome` to the new one, which fetches again.
  const state$: Observable<CommentsStoreState> = useMemo(() => {
    if (!client || !listenerStore) return of(IDLE_STATE)

    const scope: CommentsQueryScope = {publishedId, releaseId}
    const query = getCommentsQuery(releaseId)
    const params = {
      documentId: publishedId,
      ...(releaseId ? {documentVersionId: releaseId} : {}),
    }

    const remoteActions$: Observable<CommentsStoreAction> = listenerStore.events.pipe(
      connect((events$) =>
        merge(
          // Fetch every comment on each connection. A reconnect, or the welcome after it,
          // cancels a fetch still in flight.
          events$.pipe(
            filter(isConnectionEvent),
            switchMap((event) =>
              event.type === 'reconnect'
                ? of(LOADING)
                : client.observable.fetch<CommentDocument[]>(query, params).pipe(
                    map((comments): CommentsStoreAction => ({type: 'COMMENTS_SET', comments})),
                    catchError((error) => of<CommentsStoreAction>({type: 'ERROR', error})),
                    startWith(LOADING),
                  ),
            ),
          ),
          events$.pipe(
            filter(isMutationEvent),
            map((event) => mutationToOutcome(event, scope, transactionsIdMap)),
            filter((outcome) => outcome !== null),
            tap(({latestTransactionReceivedFor}) => {
              // Let the consumer know that the latest transaction it started has been received
              if (latestTransactionReceivedFor) {
                onLatestTransactionIdReceived(latestTransactionReceivedFor)
              }
            }),
            map(({action}) => action),
          ),
        ),
      ),
      catchError((error) => of<CommentsStoreAction>({type: 'ERROR', error})),
    )

    return merge(remoteActions$, localActions$).pipe(
      scan(commentsStoreReducer, LOADING_STATE),
      distinctUntilChanged(),
    )
  }, [
    client,
    listenerStore,
    localActions$,
    onLatestTransactionIdReceived,
    publishedId,
    releaseId,
    transactionsIdMap,
  ])

  const state = useObservable(state$, () => (client ? LOADING_STATE : IDLE_STATE))

  // Transform comments object to array
  const commentsAsArray = useMemo(() => Object.values(state.comments), [state.comments])

  return {
    data: commentsAsArray,
    dispatch,
    error: state.error,
    loading: state.loading,
  }
}
