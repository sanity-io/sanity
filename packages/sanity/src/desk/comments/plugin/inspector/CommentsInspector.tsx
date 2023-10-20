import {Flex, useToast} from '@sanity/ui'
import React, {Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {usePaneRouter} from '../../../components'
import {EMPTY_PARAMS} from '../../../constants'
import {useDocumentPane} from '../../../panes/document/useDocumentPane'
import {
  useComments,
  CommentsListHandle,
  CommentCreatePayload,
  CommentEditPayload,
  CommentStatus,
  CommentDeleteDialog,
  CommentsList,
} from '../../src'
import {CommentsInspectorHeader} from './CommentsInspectorHeader'
import {DocumentInspectorProps, useCurrentUser, useUnique} from 'sanity'

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
  const commentsListHandleRef = useRef<CommentsListHandle>(null)

  const currentUser = useCurrentUser()
  const {params, createPathWithParams, setParams} = usePaneRouter()
  const uniqueParams = useUnique(params) || (EMPTY_PARAMS as Partial<{comment?: string}>)
  const commentIdParamRef = useRef<string | undefined>(uniqueParams?.comment)

  const pushToast = useToast().push
  const {onPathOpen, ready} = useDocumentPane()

  const {
    comments,
    create,
    edit,
    getComment,
    getCommentPath,
    mentionOptions,
    remove,
    selectedPath,
    setSelectedPath,
    setStatus,
    status,
    update,
  } = useComments()

  const currentComments = useMemo(() => comments.data[status], [comments, status])

  const loading = useMemo(() => {
    // The comments and the document are loaded separately which means that
    // the comments might be ready before the document is ready. Since the user should
    // be able to interact with the document from the comments inspector, we need to make sure
    // that the document is ready before we allow the user to interact with the comments.
    return comments.loading || !ready
  }, [comments.loading, ready])

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
            title: 'Copied link to clipboard',
          })
        })
        .catch(() => {
          pushToast({
            closable: true,
            status: 'error',
            title: 'Unable to copy link to clipboard',
          })
        })
    },
    [createPathWithParams, params, pushToast],
  )

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

  const handlePathSelect = useCallback(
    (path: Path) => {
      onPathOpen(path)
      setSelectedPath({
        fieldPath: PathUtils.toString(path),
        origin: 'inspector',
      })
    },
    [onPathOpen, setSelectedPath],
  )

  const handleNewThreadCreate = useCallback(
    (payload: CommentCreatePayload) => {
      create.execute(payload)

      setSelectedPath({
        fieldPath: payload.fieldPath,
        origin: 'inspector',
      })
    },
    [create, setSelectedPath],
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

  const handleScrollToComment = useCallback(
    (id: string, fieldPath: string) => {
      if (fieldPath) {
        setSelectedPath({
          fieldPath,
          origin: 'inspector',
        })

        requestAnimationFrame(() => {
          commentsListHandleRef.current?.scrollToComment(id)
        })

        setParams({
          ...params,
          comment: undefined,
        })

        commentIdParamRef.current = undefined
      }
    },
    [params, setParams, setSelectedPath],
  )

  useLayoutEffect(() => {
    const path = getCommentPath(commentIdParamRef.current || '')

    if (path && !loading && commentIdParamRef.current) {
      handleScrollToComment(commentIdParamRef.current, path)
    }
  }, [getCommentPath, handleScrollToComment, loading])

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

      <Flex direction="column" overflow="hidden" height="fill">
        <CommentsInspectorHeader
          onClose={handleCloseInspector}
          onViewChange={handleChangeView}
          view={status}
        />

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
            onReply={handleReply}
            onStatusChange={handleStatusChange}
            ref={commentsListHandleRef}
            selectedPath={selectedPath}
            status={status}
          />
        )}
      </Flex>
    </Fragment>
  )
}
