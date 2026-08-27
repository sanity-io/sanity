import {type Path} from '@sanity/types'
import orderBy from 'lodash-es/orderBy.js'
import {memo, type ReactNode, useCallback, useMemo, useState} from 'react'
import {CommentsContext} from 'sanity/_singletons'

import {useEditState} from '../../../hooks/useEditState'
import {useSchema} from '../../../hooks/useSchema'
import {useUserListWithPermissions} from '../../../hooks/useUserListWithPermissions'
import {usePerspective} from '../../../perspective/usePerspective'
import {useCurrentUser} from '../../../store/user/hooks'
import {useAddonDataset} from '../../../studio/addonDataset/useAddonDataset'
import {useWorkspace} from '../../../studio/workspace'
import {getPublishedId, getVersionFromId, isVersionId} from '../../../util/draftUtils'
import {
  type CommentOperationsHookOptions,
  useCommentOperations,
} from '../../hooks/use-comment-operations/useCommentOperations'
import {useCommentsClient} from '../../hooks/useCommentsClient'
import {useCommentsEnabled} from '../../hooks/useCommentsEnabled'
import {useCommentsStore} from '../../store/useCommentsStore'
import {
  type CommentPostPayload,
  type CommentStatus,
  type CommentsType,
  type CommentThreadItem,
  type CommentUpdatePayload,
} from '../../types'
import {buildCommentThreadItems} from '../../utils/buildCommentThreadItems'
import {type CommentsContextValue} from './types'

const EMPTY_ARRAY: [] = []

const EMPTY_COMMENTS_DATA = {
  open: EMPTY_ARRAY,
  resolved: EMPTY_ARRAY,
}

interface ThreadItemsByStatus {
  open: CommentThreadItem[]
  resolved: CommentThreadItem[]
}

/**
 * @beta
 * @hidden
 */
export interface CommentsProviderProps {
  children: ReactNode
  /**
   * Published / group id. Used for the comments GDR and edit state.
   */
  documentId: string
  /**
   * Exact document in the editor (draft, published, or version id).
   * Drives listing, create, range ownership, and version edit state.
   */
  sourceDocumentId: string
  documentType: string
  type: CommentsType
  sortOrder: 'asc' | 'desc'

  isCommentsOpen?: boolean
  onCommentsOpen?: () => void
  getCommentLink?: (id: string) => string

  selectedCommentId?: string | undefined
  onClearSelectedComment?: () => void

  onPathOpen?: (path: Path) => void

  isConnecting?: boolean

  mentionsDisabled?: boolean
}

type DocumentId = string
type TransactionId = string

/**
 * @beta
 */
export const CommentsProvider = memo(function CommentsProvider(props: CommentsProviderProps) {
  const {
    children,
    documentId,
    sourceDocumentId,
    documentType,
    isCommentsOpen,
    onCommentsOpen,
    sortOrder,
    type,
    getCommentLink,
    onClearSelectedComment,
    selectedCommentId,
    isConnecting,
    onPathOpen,
    mentionsDisabled,
  } = props
  const commentsEnabled = useCommentsEnabled()
  const {selectedReleaseId, selectedVariantName} = usePerspective()
  const [status, setStatus] = useState<CommentStatus>('open')
  const publishedId = getPublishedId(documentId)
  const scopeId = isVersionId(sourceDocumentId) ? getVersionFromId(sourceDocumentId) : undefined

  // Opening a release/variant resolves the target document asynchronously. Until
  // `sourceDocumentId` is the version id, it can still be a draft or published id,
  // and `buildCommentsQuery` would treat that as the shared draft+published set —
  // briefly showing those comments on a version view. Wait until we have a
  // version id before listening/fetching.
  const isVersionPerspective = Boolean(selectedReleaseId || selectedVariantName)
  const commentsReady = !isVersionPerspective || isVersionId(sourceDocumentId)

  const editState = useEditState(publishedId, documentType, 'low', scopeId)
  const schemaType = useSchema().get(documentType)
  const currentUser = useCurrentUser()

  const {name: workspaceName} = useWorkspace()

  // Task documents (and their comments) live in the addon dataset, not the
  // workspace content dataset. Configure the Comments API client accordingly:
  // - Field comments: workspace content dataset (default)
  // - Task comments: addon dataset
  const addonDataset = useAddonDataset()
  const addonDatasetName = addonDataset.client?.config().dataset
  const commentsClientDataset = type === 'task' ? (addonDatasetName ?? null) : undefined
  const {client: commentsClient, loading: isCommentsClientLoading} = useCommentsClient({
    dataset: commentsClientDataset,
    loading: type === 'task' && !addonDataset.ready,
  })

  const documentValue = useMemo(() => {
    if (scopeId) return editState.version
    return editState.draft || editState.published
  }, [editState.version, editState.draft, editState.published, scopeId])

  const documentRevisionId = useMemo(() => documentValue?._rev, [documentValue])

  // A map to keep track of the latest transaction ID for each comment document.
  const [transactionsIdMap] = useState(() => new Map<DocumentId, TransactionId>())

  // When the latest transaction ID is received, we remove the transaction id from the map.
  const handleOnLatestTransactionIdReceived = useCallback(
    (commentDocumentId: string) => {
      transactionsIdMap.delete(commentDocumentId)
    },
    [transactionsIdMap],
  )

  const {
    dispatch,
    data = EMPTY_ARRAY,
    error,
    loading,
  } = useCommentsStore({
    documentId,
    sourceDocumentId,
    client: commentsClient,
    transactionsIdMap,
    onLatestTransactionIdReceived: handleOnLatestTransactionIdReceived,
    ready: commentsReady,
  })

  // When a comment update is started, we store the transaction id in a map.
  // This is used to make sure that we only use the latest transaction received
  // in the real time listener. See `useCommentsStore`.
  // This is needed since we use optimistic updates in the UI, and we want to
  // avoid that the UI is updated with an old transaction id when multiple
  // transactions are started in a short time span.
  const handleOnTransactionStart = useCallback(
    (commentDocumentId: string, transactionId: string) => {
      transactionsIdMap.set(commentDocumentId, transactionId)
    },
    [transactionsIdMap],
  )

  const handleSetStatus = useCallback(
    (newStatus: CommentStatus) => {
      // Avoids going to "resolved" when using links to comments
      if (commentsEnabled.mode === 'upsell' && newStatus === 'resolved') {
        return null
      }
      return setStatus(newStatus)
    },
    [setStatus, commentsEnabled],
  )

  const projectMentionOptions = useUserListWithPermissions(
    useMemo(() => ({documentValue, permission: 'read'}), [documentValue]),
  )

  // Read access is resolved from the project user, but comments store mentions as
  // global user ids, so the options expose the global id. Members without one
  // (e.g. third-party login) cannot be mentioned.
  const mentionOptions = useMemo(() => {
    const data = projectMentionOptions.data?.flatMap((user) =>
      user.sanityUserId ? [{...user, id: user.sanityUserId, projectUserId: user.id}] : [],
    )

    return {
      ...projectMentionOptions,
      data: data ?? null,
      disabled: mentionsDisabled,
    }
  }, [projectMentionOptions, mentionsDisabled])

  const threadItemsByStatus: ThreadItemsByStatus = useMemo(() => {
    if (!currentUser) {
      return EMPTY_COMMENTS_DATA
    }
    const sorted = orderBy(data, ['_createdAt'], [sortOrder])
    let items: CommentThreadItem[] = []
    if (type === 'task') {
      items = buildCommentThreadItems({comments: sorted, currentUser, documentValue, type})
    } else {
      if (!schemaType) {
        return EMPTY_COMMENTS_DATA
      }
      items = buildCommentThreadItems({
        comments: sorted,
        currentUser,
        documentValue,
        schemaType,
        type,
      })
    }
    return {
      open: items.filter((item) => item.parentComment.status === 'open'),
      resolved: items.filter((item) => item.parentComment.status === 'resolved'),
    }
  }, [currentUser, data, documentValue, schemaType, sortOrder, type])

  const getThreadLength = useCallback(
    (threadId: string) => {
      return threadItemsByStatus.open.filter((item) => item.threadId === threadId).length
    },
    [threadItemsByStatus.open],
  )

  const getComment = useCallback((id: string) => data?.find((c) => c._id === id), [data])

  const handleOnCreate = useCallback(
    (payload: CommentPostPayload) => {
      // If the comment we try to create already exists in the local state and has
      // the 'createError' state, we know that we are retrying a comment creation.
      // In that case, we want to change the state to 'createRetrying'.
      const hasError = data?.find((c) => c._id === payload._id)?._state?.type === 'createError'

      dispatch({
        type: 'COMMENT_ADDED',
        payload: {
          ...payload,
          _state: hasError ? {type: 'createRetrying'} : undefined,
        },
      })
    },
    [data, dispatch],
  )

  const handleOnUpdate = useCallback(
    (id: string, payload: CommentUpdatePayload) => {
      dispatch({
        type: 'COMMENT_UPDATED',
        payload: {
          _id: id,
          ...payload,
        },
      })
    },
    [dispatch],
  )

  const handleOnCreateError = useCallback(
    (id: string, err: Error) => {
      // When an error occurs during comment creation, we update the comment state
      // to `createError`. This will make the comment appear in the UI as a comment
      // that failed to be created. The user can then retry the comment creation.
      dispatch({
        type: 'COMMENT_UPDATED',
        payload: {
          _id: id,
          _state: {
            error: err,
            type: 'createError',
          },
        },
      })
    },
    [dispatch],
  )

  const {operation} = useCommentOperations(
    useMemo(
      (): CommentOperationsHookOptions => ({
        client: commentsClient,
        currentUser,
        sourceDocumentId,
        // Used to resolve the document title for notifications in the current release
        documentVersionId: scopeId,
        documentRevisionId,
        documentType,
        getComment,
        getThreadLength,
        schemaType,
        workspace: workspaceName,
        // The following callbacks runs when the comment operation are executed.
        // They are used to update the local state of the comments immediately after
        // a comment operation has been executed. This is done to avoid waiting for
        // the real time listener to update the comments and make the UI feel more
        // responsive. The comment will be updated again when we receive an mutation
        // event from the real time listener.
        onCreate: handleOnCreate,
        onCreateError: handleOnCreateError,
        onUpdate: handleOnUpdate,
        onTransactionStart: handleOnTransactionStart,
        getCommentLink,
      }),
      [
        commentsClient,
        currentUser,
        sourceDocumentId,
        scopeId,
        documentRevisionId,
        documentType,
        getComment,
        getThreadLength,
        schemaType,
        workspaceName,
        handleOnCreate,
        handleOnCreateError,
        handleOnUpdate,
        handleOnTransactionStart,
        getCommentLink,
      ],
    ),
  )

  // Comments stay read-only until we can call the API:
  // - commentsClient: null while org id / project / dataset are still resolving
  // - sanityUserId: required as the acting user
  // - commentsReady: false in a version perspective until sourceDocumentId is a version id
  const readOnly = !commentsClient || !currentUser?.sanityUserId || !commentsReady

  const ctxValue = useMemo(
    (): CommentsContextValue => ({
      documentId,
      documentType,
      sourceDocumentId,

      status,
      setStatus: handleSetStatus,
      getComment,
      getCommentLink,
      onClearSelectedComment,
      selectedCommentId,

      isCommentsOpen,
      onCommentsOpen,

      isConnecting,

      onPathOpen,

      comments: {
        data: threadItemsByStatus,
        error,
        loading: loading || isCommentsClientLoading || isConnecting || false,
      },

      operation: {
        create: operation.create,
        react: operation.react,
        remove: operation.remove,
        update: operation.update,
        updateRange: operation.updateRange,
      },
      mentionOptions,
      readOnly,
    }),
    [
      documentId,
      sourceDocumentId,
      documentType,
      isCommentsClientLoading,
      status,
      handleSetStatus,
      getComment,
      getCommentLink,
      onClearSelectedComment,
      selectedCommentId,
      isCommentsOpen,
      onCommentsOpen,
      isConnecting,
      onPathOpen,
      threadItemsByStatus,
      error,
      loading,
      operation.create,
      operation.react,
      operation.remove,
      operation.update,
      operation.updateRange,
      mentionOptions,
      readOnly,
    ],
  )

  return <CommentsContext.Provider value={ctxValue}>{children}</CommentsContext.Provider>
})
