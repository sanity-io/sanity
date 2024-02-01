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
  CommentsOnboardingPopover,
  CommentsSelectedPath,
  CommentStatus,
  CommentsUIMode,
  CommentsUpsellPanel,
  useComments,
  useCommentsEnabled,
  useCommentsOnboarding,
  useCommentsScroll,
  useCommentsSelectedPath,
  useCommentsUpsell,
} from '../../src'
import {commentsLocaleNamespace} from '../../i18n'
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
  const {onPathOpen, ready} = useDocumentPane()

  const {scrollToComment, scrollToField, scrollToInlineComment} = useCommentsScroll()
  const {selectedPath, setSelectedPath} = useCommentsSelectedPath()
  const {isDismissed, setDismissed} = useCommentsOnboarding()
  const {upsellData, telemetryLogs} = useCommentsUpsell()
  const {comments, getComment, isRunningSetup, mentionOptions, setStatus, status, operation} =
    useComments()

  const currentComments = useMemo(() => comments.data[status], [comments, status])

  const loading = useMemo(() => {
    // The comments and the document are loaded separately which means that
    // the comments might be ready before the document is ready. Since the user should
    // be able to interact with the document from the comments inspector, we need to make sure
    // that the document is ready before we allow the user to interact with the comments.
    return comments.loading || !ready
  }, [comments.loading, ready])

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

        scrollToField(nextPath.fieldPath)

        const isInlineComment = comments.data.open
          .filter((c) => c.threadId === nextPath?.threadId)
          .some((x) => x.selection?.type === 'text')

        if (isInlineComment && nextPath.threadId) {
          scrollToInlineComment(nextPath.threadId)
        }
      }
    },
    [comments.data.open, onPathOpen, scrollToField, scrollToInlineComment, setSelectedPath],
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
          fieldPath: comment.target.path.field || null,
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
    // Clear the selected path when clicking outside the comments inspector.
    // We do this only when the comments inspector is the top layer.
    if (selectedPath && isTopLayer) {
      setSelectedPath(null)
    }
  }, [isTopLayer, selectedPath, setSelectedPath])

  useClickOutside(handleDeselectPath, [rootRef.current])

  // Handle scroll to comment from URL param
  useEffect(() => {
    // Make sure that the comment exists before we try to scroll to it.
    // We can't solely rely on the comment id from the url since the comment might not be loaded yet.
    const commentToScrollTo = getComment(commentIdParamRef.current || '')

    if (!loading && commentToScrollTo && didScrollToCommentFromParam.current === false) {
      // Make sure we have the correct status set before we scroll to the comment
      setStatus(commentToScrollTo.status || 'open')

      setSelectedPath({
        fieldPath: commentToScrollTo.target.path.field || null,
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
            readOnly={isRunningSetup}
            selectedPath={selectedPath}
            status={status}
          />
        )}
        {mode === 'default' && <CommentsInspectorFeedbackFooter />}
      </Flex>
    </Fragment>
  )
}
