import {Flex, Layer, useClickOutside, useLayer, useToast} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type DocumentInspectorProps, useCurrentUser, useTranslation, useUnique} from 'sanity'
import styled from 'styled-components'

import {usePaneRouter} from '../../../components'
import {EMPTY_PARAMS} from '../../../constants'
import {useDocumentPane} from '../../../panes/document/useDocumentPane'
import {commentsLocaleNamespace} from '../../i18n'
import {
  type CommentBaseCreatePayload,
  CommentDeleteDialog,
  type CommentReactionOption,
  CommentsList,
  CommentsOnboardingPopover,
  type CommentsSelectedPath,
  type CommentStatus,
  type CommentsUIMode,
  CommentsUpsellPanel,
  type CommentUpdatePayload,
  isTextSelectionComment,
  useComments,
  useCommentsEnabled,
  useCommentsOnboarding,
  useCommentsScroll,
  useCommentsSelectedPath,
  useCommentsUpsell,
} from '../../src'
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
  const {params, createPathWithParams, setParams} = usePaneRouter()
  const uniqueParams = useUnique(params) || (EMPTY_PARAMS as Partial<{comment?: string}>)
  const commentIdParamRef = useRef<string | undefined>(uniqueParams?.comment)

  const didScrollToCommentFromParam = useRef<boolean>(false)

  const pushToast = useToast().push
  const {isTopLayer} = useLayer()
  const {onPathOpen, connectionState} = useDocumentPane()

  const {scrollToComment, scrollToField, scrollToInlineComment} = useCommentsScroll()
  const {selectedPath, setSelectedPath} = useCommentsSelectedPath()
  const {isDismissed, setDismissed} = useCommentsOnboarding()

  const {comments, getComment, isCreatingDataset, mentionOptions, setStatus, status, operation} =
    useComments()
  const {upsellData, telemetryLogs} = useCommentsUpsell()

  const currentComments = useMemo(() => comments.data[status], [comments, status])

  const loading = useMemo(() => {
    return comments.loading || connectionState === 'connecting'
  }, [comments.loading, connectionState])

  useEffect(() => {
    if (mode === 'upsell') {
      if (selectedPath?.origin === 'form') {
        telemetryLogs.panelViewed('field_action')
      } else if (commentIdParamRef.current) {
        telemetryLogs.panelViewed('link')
      } else {
        telemetryLogs.panelViewed('document_action')
      }
    }
    return () => {
      if (mode === 'upsell') {
        telemetryLogs.panelDismissed()
      }
    }
    // We want to run this effect only on mount and unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        onPathOpen(path)

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

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      // Clear the selected path when clicking outside the comments inspector.
      // We do this only when the comments inspector is the top layer.
      const isPTETarget =
        e.target instanceof HTMLElement && e.target?.hasAttribute('data-slate-string')

      if (!isPTETarget) {
        handleDeselectPath()
      }
    },
    [handleDeselectPath],
  )

  useClickOutside(handleClickOutside, [rootRef.current])

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

      setParams({
        ...params,
        comment: undefined,
      })
    }
  }, [getComment, loading, params, scrollToComment, setParams, setSelectedPath, setStatus])

  const beforeListNode = useMemo(() => {
    if (mode === 'upsell' && upsellData) {
      return (
        <CommentsUpsellPanel
          data={upsellData}
          // eslint-disable-next-line react/jsx-handler-names
          onPrimaryClick={telemetryLogs.panelPrimaryClicked}
          // eslint-disable-next-line react/jsx-handler-names
          onSecondaryClick={telemetryLogs.panelSecondaryClicked}
        />
      )
    }

    return null
  }, [mode, telemetryLogs.panelPrimaryClicked, telemetryLogs.panelSecondaryClicked, upsellData])

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
