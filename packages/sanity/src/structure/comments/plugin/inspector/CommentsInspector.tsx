import {Flex, Layer, useClickOutside, useLayer, useToast} from '@sanity/ui'
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import * as PathUtils from '@sanity/util/paths'
import styled from 'styled-components'
import {usePaneRouter} from '../../../components'
import {EMPTY_PARAMS} from '../../../constants'
import {useDocumentPane} from '../../../panes/document/useDocumentPane'
import {
  CommentCreatePayload,
  CommentDeleteDialog,
  CommentEditPayload,
  CommentReactionOption,
  CommentsList,
  CommentsListHandle,
  CommentsOnboardingPopover,
  CommentsSelectedPath,
  CommentStatus,
  useComments,
  useCommentsEnabled,
  useCommentsOnboarding,
  useCommentsSelectedPath,
} from '../../src'
import {commentsLocaleNamespace} from '../../i18n'
import UpsellPanel from '../../src/components/upsell/UpsellPanel'
import {CommentsInspectorHeader} from './CommentsInspectorHeader'
import {CommentsInspectorFeedbackFooter} from './CommentsInspectorFeedbackFooter'
import {DocumentInspectorProps, useCurrentUser, useTranslation, useUnique} from 'sanity'

interface CommentToDelete {
  commentId: string
  isParent: boolean
}

const RootLayer = styled(Layer)`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`

export function CommentsInspector(props: DocumentInspectorProps) {
  const {enabled} = useCommentsEnabled()

  if (!enabled) return null

  // We wrap the comments inspector in a Layer in order to know when the comments inspector
  // is the top layer (that is, if there is e.g. a popover open). This is used to determine
  // if we should deselect the selected path when clicking outside the comments inspector.
  return (
    <RootLayer>
      <CommentsInspectorInner {...props} />
    </RootLayer>
  )
}

function CommentsInspectorInner(props: DocumentInspectorProps) {
  const {t} = useTranslation(commentsLocaleNamespace)
  const {onClose} = props
  const commentsEnabled = useCommentsEnabled()
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false)
  const [commentToDelete, setCommentToDelete] = useState<CommentToDelete | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<Error | null>(null)
  const commentsListHandleRef = useRef<CommentsListHandle>(null)

  const rootRef = useRef<HTMLDivElement | null>(null)

  const currentUser = useCurrentUser()
  const {params, createPathWithParams, setParams} = usePaneRouter()
  const uniqueParams = useUnique(params) || (EMPTY_PARAMS as Partial<{comment?: string}>)
  const commentIdParamRef = useRef<string | undefined>(uniqueParams?.comment)

  const didScrollToCommentFromParam = useRef<boolean>(false)

  const pushToast = useToast().push
  const {onPathOpen, ready} = useDocumentPane()

  const {isDismissed, setDismissed} = useCommentsOnboarding()

  const {comments, getComment, isRunningSetup, mentionOptions, setStatus, status, operation} =
    useComments()

  const {isTopLayer} = useLayer()

  const currentComments = useMemo(() => comments.data[status], [comments, status])

  const loading = useMemo(() => {
    // The comments and the document are loaded separately which means that
    // the comments might be ready before the document is ready. Since the user should
    // be able to interact with the document from the comments inspector, we need to make sure
    // that the document is ready before we allow the user to interact with the comments.
    return comments.loading || !ready
  }, [comments.loading, ready])

  const {selectedPath, setSelectedPath} = useCommentsSelectedPath()

  const handleChangeView = useCallback(
    (nextView: CommentStatus) => {
      setStatus(nextView)
      setSelectedPath(null)
    },
    [setSelectedPath, setStatus],
  )

  const handleCloseInspector = useCallback(() => {
    onClose()
    setSelectedPath(null)
  }, [onClose, setSelectedPath])

  const handleCopyLink = useCallback(
    (id: string) => {
      const path = createPathWithParams({
        ...params,
        comment: id,
      })

      const url = `${window.location.origin}${path}`

      navigator.clipboard
        .writeText(url)
        .then(() => {
          pushToast({
            closable: true,
            status: 'info',
            title: t('copy-link-success-message'),
          })
        })
        .catch(() => {
          pushToast({
            closable: true,
            status: 'error',
            title: t('copy-link-error-message'),
          })
        })
    },
    [createPathWithParams, params, pushToast, t],
  )

  const handleCreateRetry = useCallback(
    (id: string) => {
      const comment = getComment(id)
      if (!comment) return

      operation.create({
        fieldPath: comment.target.path.field,
        id: comment._id,
        message: comment.message,
        parentCommentId: comment.parentCommentId,
        reactions: comment.reactions || [],
        status: comment.status,
        threadId: comment.threadId,
      })
    },
    [getComment, operation],
  )

  const closeDeleteDialog = useCallback(() => {
    if (deleteLoading) return
    setShowDeleteDialog(false)
    setCommentToDelete(null)
  }, [deleteLoading])

  const handlePathSelect = useCallback(
    (nextPath: CommentsSelectedPath) => {
      setSelectedPath(nextPath)

      if (nextPath?.fieldPath) {
        const path = PathUtils.fromString(nextPath.fieldPath)
        onPathOpen(path)
      }
    },
    [onPathOpen, setSelectedPath],
  )

  const handleNewThreadCreate = useCallback(
    (payload: CommentCreatePayload) => {
      operation.create(payload)

      setSelectedPath({
        fieldPath: payload.fieldPath,
        origin: 'inspector',
        threadId: payload.threadId,
      })
    },
    [operation, setSelectedPath],
  )

  const handleReply = useCallback(
    (payload: CommentCreatePayload) => {
      operation.create(payload)
    },
    [operation],
  )

  const handleEdit = useCallback(
    (id: string, payload: CommentEditPayload) => {
      operation.edit(id, payload)
    },
    [operation],
  )

  const onDeleteStart = useCallback(
    (id: string) => {
      const parent = currentComments.find((c) => c.parentComment?._id === id)
      const isParent = Boolean(parent && parent?.replies?.length > 0)

      setShowDeleteDialog(true)
      setCommentToDelete({
        commentId: id,
        isParent,
      })
    },

    [currentComments],
  )

  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      try {
        setDeleteLoading(true)
        await operation.remove(id)
        closeDeleteDialog()
      } catch (err) {
        setDeleteError(err)
      } finally {
        setDeleteLoading(false)
      }
    },
    [closeDeleteDialog, operation],
  )

  const handleScrollToComment = useCallback(
    (id: string, origin?: CommentsSelectedPath['origin']) => {
      const comment = getComment(id)

      if (comment) {
        setSelectedPath({
          fieldPath: comment.target.path.field || null,
          origin: origin || 'inspector',
          threadId: comment.threadId || null,
        })

        setTimeout(() => {
          commentsListHandleRef.current?.scrollToComment(id)
        })
      }
    },
    [getComment, setSelectedPath],
  )

  const handleStatusChange = useCallback(
    (id: string, nextStatus: CommentStatus) => {
      operation.update(id, {
        status: nextStatus,
      })

      // If the comment is being opened, we want to change to the "open" view
      // and scroll to the comment
      if (nextStatus === 'open') {
        setStatus('open')
        handleScrollToComment(id)
      }
    },
    [handleScrollToComment, operation, setStatus],
  )

  const handleReactionSelect = useCallback(
    (id: string, reaction: CommentReactionOption) => {
      operation.react(id, reaction)
    },
    [operation],
  )

  const handleDeselectPath = useCallback(() => {
    // Clear the selected path when clicking outside the comments inspector.
    // We do this only when the comments inspector is the top layer.
    if (selectedPath && isTopLayer) {
      setSelectedPath(null)
    }
  }, [isTopLayer, selectedPath, setSelectedPath])

  useClickOutside(handleDeselectPath, [rootRef.current])

  useEffect(() => {
    // Make sure that the comment exists before we try to scroll to it.
    // We can't solely rely on the comment id from the url since the comment might not be loaded yet.
    const commentToScrollTo = getComment(commentIdParamRef.current || '')

    if (!loading && commentToScrollTo && didScrollToCommentFromParam.current === false) {
      // Make sure we have the correct status set before we scroll to the comment
      setStatus(commentToScrollTo.status || 'open')

      // The second argument sets the select path origin to 'url' which will prevent the field in the form
      // the comment  refers to from being selected and scrolled to. This is because, on mount, we will in
      // some cases attempt to perform two scrolls: one to the field and one to the comment.
      // These scroll events seems to interfere with each other and the result is that the comment is not
      // scrolled to. Therefore, when there's a comment id in the url, we prioritize scrolling to the comment
      // and not the field.
      handleScrollToComment(commentToScrollTo._id, 'url')

      didScrollToCommentFromParam.current = true
      commentIdParamRef.current = undefined

      setParams({
        ...params,
        comment: undefined,
      })
    }
  }, [getComment, handleScrollToComment, loading, params, setParams, setStatus])

  return (
    <Fragment>
      {commentToDelete && showDeleteDialog && (
        <CommentDeleteDialog
          {...commentToDelete}
          error={deleteError}
          loading={deleteLoading}
          onClose={closeDeleteDialog}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <Flex
        direction="column"
        flex={1}
        height="fill"
        onClick={handleDeselectPath}
        overflow="hidden"
        ref={rootRef}
      >
        <CommentsOnboardingPopover
          onDismiss={setDismissed}
          open={!isDismissed}
          placement="left-start"
        >
          <CommentsInspectorHeader
            onClose={handleCloseInspector}
            onViewChange={handleChangeView}
            view={status}
          />
        </CommentsOnboardingPopover>
        {commentsEnabled.reason === 'upsell' && <UpsellPanel />}

        {currentUser && (
          <CommentsList
            comments={currentComments}
            currentUser={currentUser}
            error={comments.error}
            loading={loading}
            mentionOptions={mentionOptions}
            onCopyLink={handleCopyLink}
            onCreateRetry={handleCreateRetry}
            onDelete={onDeleteStart}
            onEdit={handleEdit}
            onNewThreadCreate={handleNewThreadCreate}
            onPathSelect={handlePathSelect}
            onReactionSelect={handleReactionSelect}
            onReply={handleReply}
            onStatusChange={handleStatusChange}
            readOnly={isRunningSetup}
            ref={commentsListHandleRef}
            selectedPath={selectedPath}
            status={status}
          />
        )}
        {commentsEnabled.reason !== 'upsell' && <CommentsInspectorFeedbackFooter />}
      </Flex>
    </Fragment>
  )
}
