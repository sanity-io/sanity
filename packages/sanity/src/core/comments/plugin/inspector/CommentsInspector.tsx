import {Flex, Layer, useClickOutsideEvent, useLayer, useToast} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {type DocumentInspectorProps} from '../../../config'
import {useTranslation} from '../../../i18n'
import {useCurrentUser} from '../../../store'
import {
  CommentDeleteDialog,
  CommentsList,
  CommentsOnboardingPopover,
  CommentsUpsellPanel,
} from '../../components'
import {type CommentsSelectedPath} from '../../context'
import {isTextSelectionComment} from '../../helpers'
import {
  useComments,
  useCommentsEnabled,
  useCommentsOnboarding,
  useCommentsScroll,
  useCommentsSelectedPath,
  useCommentsTelemetry,
  useCommentsUpsell,
} from '../../hooks'
import {commentsLocaleNamespace} from '../../i18n'
import {
  type CommentBaseCreatePayload,
  type CommentReactionOption,
  type CommentStatus,
  type CommentsUIMode,
  type CommentUpdatePayload,
} from '../../types'
import {CommentsInspectorFeedbackFooter} from './CommentsInspectorFeedbackFooter'
import {CommentsInspectorHeader} from './CommentsInspectorHeader'

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
  const {enabled, mode} = useCommentsEnabled()

  if (!enabled) return null

  // We wrap the comments inspector in a Layer in order to know when the comments inspector
  // is the top layer (that is, if there is e.g. a popover open). This is used to determine
  // if we should deselect the selected path when clicking outside the comments inspector.
  return (
    <RootLayer>
      <CommentsInspectorInner {...props} mode={mode} />
    </RootLayer>
  )
}

function CommentsInspectorInner(
  props: DocumentInspectorProps & {
    mode: CommentsUIMode
  },
) {
  const {t} = useTranslation(commentsLocaleNamespace)
  const {onClose, mode} = props
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false)
  const [commentToDelete, setCommentToDelete] = useState<CommentToDelete | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<Error | null>(null)

  const rootRef = useRef<HTMLDivElement | null>(null)

  const currentUser = useCurrentUser()
  const {
    comments,
    getComment,
    isCreatingDataset,
    mentionOptions,
    setStatus,
    status,
    operation,
    selectedCommentId,
    getCommentLink,
    onClearSelectedComment,
    onPathOpen,
  } = useComments()
  const commentIdParamRef = useRef<string | undefined>(selectedCommentId)

  const didScrollToCommentFromParam = useRef<boolean>(false)

  const pushToast = useToast().push
  const {isTopLayer} = useLayer()

  const {scrollToComment, scrollToField, scrollToInlineComment} = useCommentsScroll()
  const {selectedPath, setSelectedPath} = useCommentsSelectedPath()
  const {isDismissed, setDismissed} = useCommentsOnboarding()
  const telemetry = useCommentsTelemetry()

  const {upsellData, telemetryLogs: upsellTelemetryLogs} = useCommentsUpsell()

  const currentComments = useMemo(() => comments.data[status], [comments, status])

  const {loading} = comments

  const handleChangeView = useCallback(
    (nextView: CommentStatus) => {
      setStatus(nextView)
      setSelectedPath(null)

      telemetry.commentListViewChanged(nextView)
    },
    [setSelectedPath, setStatus, telemetry],
  )

  const handleCloseInspector = useCallback(() => {
    onClose()
    setSelectedPath(null)
  }, [onClose, setSelectedPath])

  const handleCopyLink = useMemo(() => {
    if (!getCommentLink) return undefined

    const copyLink = (id: string) => {
      navigator.clipboard.writeText(getCommentLink(id)).catch(() => {
        pushToast({
          closable: true,
          status: 'error',
          title: t('copy-link-error-message'),
        })
      })

      telemetry.commentLinkCopied()
    }

    return copyLink
  }, [getCommentLink, pushToast, t, telemetry])

  const handleCreateRetry = useCallback(
    (id: string) => {
      const comment = getComment(id)
      if (!comment) return

      operation.create({
        type: 'field',
        fieldPath: comment.target.path?.field || '',
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
        onPathOpen?.(path)

        scrollToField(nextPath.fieldPath)

        const isInlineComment = comments.data.open
          .filter((c) => c.threadId === nextPath?.threadId)
          .some((x) => isTextSelectionComment(x.parentComment))

        if (isInlineComment && nextPath.threadId) {
          scrollToInlineComment(nextPath.threadId)
        }
      }
    },
    [comments.data.open, onPathOpen, scrollToField, scrollToInlineComment, setSelectedPath],
  )

  const handleNewThreadCreate = useCallback(
    (nextComment: CommentBaseCreatePayload) => {
      const fieldPath = nextComment?.payload?.fieldPath || ''

      operation.create({
        type: 'field',
        fieldPath,
        message: nextComment.message,
        parentCommentId: nextComment.parentCommentId,
        reactions: nextComment.reactions,
        status: nextComment.status,
        threadId: nextComment.threadId,
      })

      setSelectedPath({
        fieldPath,
        origin: 'inspector',
        threadId: nextComment.threadId,
      })
    },
    [operation, setSelectedPath],
  )

  const handleReply = useCallback(
    (nextComment: CommentBaseCreatePayload) => {
      operation.create({
        ...nextComment,
        type: 'field',
        fieldPath: nextComment?.payload?.fieldPath || '',
      })
    },
    [operation],
  )

  const handleEdit = useCallback(
    (id: string, nextComment: CommentUpdatePayload) => {
      operation.update(id, nextComment)
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

  const handleStatusChange = useCallback(
    (id: string, nextStatus: CommentStatus) => {
      operation.update(id, {
        status: nextStatus,
      })

      // If the comment is being opened, we want to change to the "open" view
      // and scroll to the comment
      if (nextStatus === 'open') {
        setStatus('open')

        const comment = getComment(id)

        if (!comment) return

        setSelectedPath({
          fieldPath: comment.target.path?.field || null,
          origin: 'inspector',
          threadId: comment.threadId || null,
        })

        scrollToComment(id)
      }
    },
    [getComment, operation, scrollToComment, setSelectedPath, setStatus],
  )

  const handleReactionSelect = useCallback(
    (id: string, reaction: CommentReactionOption) => {
      operation.react(id, reaction)
    },
    [operation],
  )

  const handleDeselectPath = useCallback(() => {
    // Clear the selected path when:
    // - Clicking outside the inspector when it's the top layer
    // - The target is not a slate editor string. This is needed because we do not want to
    //   frequently deselect the selected path when clicking inside the editor.
    if (selectedPath && isTopLayer) {
      setSelectedPath(null)
    }
  }, [isTopLayer, selectedPath, setSelectedPath])

  useClickOutsideEvent(
    (event) => {
      // Clear the selected path when clicking outside the comments inspector.
      // We do this only when the comments inspector is the top layer.
      const isPTETarget =
        event.target instanceof HTMLElement && event.target?.hasAttribute('data-slate-string')

      if (!isPTETarget) {
        handleDeselectPath()
      }
    },
    () => [rootRef.current],
  )

  const [loggedTelemetry, setLoggedTelemetry] = useState(false)
  useEffect(() => {
    if (loggedTelemetry || mode !== 'upsell') return undefined
    setLoggedTelemetry(true)
    if (selectedPath?.origin === 'form') {
      upsellTelemetryLogs.panelViewed('field_action')
    } else if (commentIdParamRef.current) {
      upsellTelemetryLogs.panelViewed('link')
    } else {
      upsellTelemetryLogs.panelViewed('document_action')
    }
    return () => {
      upsellTelemetryLogs.panelDismissed()
    }
  }, [loggedTelemetry, mode, selectedPath?.origin, upsellTelemetryLogs])

  // Handle scroll to comment from URL param
  useEffect(() => {
    // Make sure that the comment exists before we try to scroll to it.
    // We can't solely rely on the comment id from the url since the comment might not be loaded yet.
    const commentToScrollTo = getComment(commentIdParamRef.current || '')

    if (!loading && commentToScrollTo && didScrollToCommentFromParam.current === false) {
      // Make sure we have the correct status set before we scroll to the comment
      setStatus(commentToScrollTo.status || 'open')

      setSelectedPath({
        fieldPath: commentToScrollTo.target.path?.field || null,
        origin: 'url',
        threadId: commentToScrollTo.threadId || null,
      })

      scrollToComment(commentToScrollTo._id)

      didScrollToCommentFromParam.current = true
      commentIdParamRef.current = undefined

      onClearSelectedComment?.()

      telemetry.commentViewedFromLink()
    }
  }, [
    getComment,
    loading,
    onClearSelectedComment,
    scrollToComment,
    setSelectedPath,
    setStatus,
    telemetry,
  ])

  const beforeListNode = useMemo(() => {
    if (mode === 'upsell' && upsellData) {
      return (
        <CommentsUpsellPanel
          data={upsellData}
          // eslint-disable-next-line react/jsx-handler-names
          onPrimaryClick={upsellTelemetryLogs.panelPrimaryClicked}
          // eslint-disable-next-line react/jsx-handler-names
          onSecondaryClick={upsellTelemetryLogs.panelSecondaryClicked}
        />
      )
    }

    return null
  }, [
    mode,
    upsellTelemetryLogs.panelPrimaryClicked,
    upsellTelemetryLogs.panelSecondaryClicked,
    upsellData,
  ])

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
            mode={mode}
          />
        </CommentsOnboardingPopover>

        {currentUser && (
          <CommentsList
            beforeListNode={beforeListNode}
            comments={currentComments}
            currentUser={currentUser}
            error={comments.error}
            loading={loading}
            mentionOptions={mentionOptions}
            mode={mode}
            onCopyLink={handleCopyLink}
            onCreateRetry={handleCreateRetry}
            onDelete={onDeleteStart}
            onEdit={handleEdit}
            onNewThreadCreate={handleNewThreadCreate}
            onPathSelect={handlePathSelect}
            onReactionSelect={handleReactionSelect}
            onReply={handleReply}
            onStatusChange={handleStatusChange}
            readOnly={isCreatingDataset}
            selectedPath={selectedPath}
            status={status}
          />
        )}
        {mode === 'default' && <CommentsInspectorFeedbackFooter />}
      </Flex>
    </Fragment>
  )
}
