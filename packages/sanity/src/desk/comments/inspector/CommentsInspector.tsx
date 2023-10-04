import {Flex} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Path} from '@sanity/types'
import {useDocumentPane} from '../../panes/document/useDocumentPane'
import {usePaneRouter} from '../../components'
import {EMPTY_PARAMS} from '../../constants'
import {CommentsInspectorHeader} from './CommentsInspectorHeader'
import {
  CommentCreatePayload,
  CommentDeleteDialog,
  CommentEditPayload,
  CommentsList,
  CommentsListHandle,
  CommentStatus,
  DocumentInspectorProps,
  useComments,
  useCurrentUser,
  useUnique,
} from 'sanity'

interface CommentToDelete {
  commentId: string
  isParent: boolean
}

export function CommentsInspector(props: DocumentInspectorProps) {
  const {onClose} = props

  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false)
  const [commentToDelete, setCommentToDelete] = useState<CommentToDelete | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<Error | null>(null)

  const {onPathOpen, onFocus} = useDocumentPane()

  const currentUser = useCurrentUser()
  const paneRouter = usePaneRouter()
  const params = useUnique(paneRouter.params) || (EMPTY_PARAMS as Partial<{comment?: string}>)
  const commentIdParamRef = useRef<string | undefined>(params?.comment)

  const {comments, create, edit, mentionOptions, remove, update, status, setStatus, getComment} =
    useComments()

  const currentComments = useMemo(() => comments.data[status], [comments, status])

  const commentsListHandleRef = useRef<CommentsListHandle>(null)
  const didScrollDown = useRef<boolean>(false)

  useEffect(() => {
    if (commentIdParamRef.current && !didScrollDown.current && !comments.loading) {
      commentsListHandleRef.current?.scrollToComment(commentIdParamRef.current)
      didScrollDown.current = true
    }

    return () => {
      didScrollDown.current = false
    }
  }, [comments.loading])

  const handleCreateRetry = useCallback(
    (id: string) => {
      const comment = getComment(id)
      if (!comment) return

      create.execute({
        fieldPath: comment.target.path.field,
        id: comment._id,
        message: comment.message,
        parentCommentId: comment.parentCommentId,
        status: comment.status,
        threadId: comment.threadId,
      })
    },
    [create, getComment],
  )

  const closeDeleteDialog = useCallback(() => {
    if (deleteLoading) return
    setShowDeleteDialog(false)
    setCommentToDelete(null)
  }, [deleteLoading])

  const handlePathFocus = useCallback(
    (path: Path) => {
      onPathOpen(path)
      onFocus(path)
    },
    [onFocus, onPathOpen],
  )

  const handleNewThreadCreate = useCallback(
    (payload: CommentCreatePayload) => {
      create.execute(payload)
    },
    [create],
  )

  const handleReply = useCallback(
    (payload: CommentCreatePayload) => {
      create.execute(payload)
    },
    [create],
  )

  const handleEdit = useCallback(
    (id: string, payload: CommentEditPayload) => {
      edit.execute(id, payload)
    },
    [edit],
  )

  const handleStatusChange = useCallback(
    (id: string, nextStatus: CommentStatus) => {
      update.execute(id, {
        status: nextStatus,
      })
    },
    [update],
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
        await remove.execute(id)
        closeDeleteDialog()
      } catch (err) {
        setDeleteError(err)
      } finally {
        setDeleteLoading(false)
      }
    },
    [closeDeleteDialog, remove],
  )

  return (
    <>
      {commentToDelete && showDeleteDialog && (
        <CommentDeleteDialog
          {...commentToDelete}
          error={deleteError}
          loading={deleteLoading}
          onClose={closeDeleteDialog}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <Flex direction="column" overflow="hidden" height="fill">
        <CommentsInspectorHeader onClose={onClose} onViewChange={setStatus} view={status} />

        {currentUser && (
          <CommentsList
            comments={currentComments}
            currentUser={currentUser}
            error={comments.error}
            loading={comments.loading}
            mentionOptions={mentionOptions}
            onCreateRetry={handleCreateRetry}
            onDelete={onDeleteStart}
            onEdit={handleEdit}
            onNewThreadCreate={handleNewThreadCreate}
            onPathFocus={handlePathFocus}
            onReply={handleReply}
            onStatusChange={handleStatusChange}
            ref={commentsListHandleRef}
            status={status}
          />
        )}
      </Flex>
    </>
  )
}
