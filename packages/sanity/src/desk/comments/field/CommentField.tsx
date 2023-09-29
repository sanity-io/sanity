import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import {useDocumentPane} from '../../panes/document/useDocumentPane'
import {COMMENTS_INSPECTOR_NAME} from '../../panes/document/constants'
import {CommentFieldButton} from './CommentFieldButton'
import {
  CommentCreatePayload,
  FieldProps,
  PortableTextBlock,
  pathToString,
  useComments,
  useCommentsEnabled,
  useCurrentUser,
  useFieldCommentsCount,
} from 'sanity'

export function CommentField(props: FieldProps) {
  const {documentId, documentType} = useDocumentPane()

  const {isEnabled} = useCommentsEnabled({
    documentId,
    documentType,
  })

  if (!isEnabled) {
    return props.renderDefault(props)
  }

  return <CommentFieldInner {...props} />
}

function CommentFieldInner(props: FieldProps) {
  const [open, setOpen] = useState<boolean>(false)
  const [value, setValue] = useState<PortableTextBlock[] | null>(null)
  const {openInspector, inspector} = useDocumentPane()
  const currentUser = useCurrentUser()
  const {create, status, setStatus, comments} = useComments()

  const count = useFieldCommentsCount(props.path)
  const hasComments = Boolean(count > 0)

  const currentComments = useMemo(() => comments.data[status], [comments.data, status])

  const [shouldScrollToThread, setShouldScrollToThread] = useState<boolean>(false)

  const threadId = useMemo(() => {
    const pathString = PathUtils.toString(props.path)

    return currentComments.find((comment) => comment.fieldPath === pathString)?.threadId
  }, [currentComments, props.path])

  const handleScrollToThread = useCallback(() => {
    if (
      status === 'open' &&
      inspector?.name === COMMENTS_INSPECTOR_NAME &&
      shouldScrollToThread &&
      threadId
    ) {
      // Find the node in the DOM
      const node = document.querySelector(`[data-thread-id="${threadId}"]`)

      // // Scroll to node with 8px offset top
      if (node) {
        requestAnimationFrame(() => {
          node.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'})
        })
      }

      // Reset shouldScrollToThread to false after performing the scroll action
      setShouldScrollToThread(false)
    }
  }, [inspector?.name, shouldScrollToThread, status, threadId])

  const handleClick = useCallback(() => {
    if (hasComments && status === 'resolved') {
      setStatus('open')
    }

    if (threadId) {
      setShouldScrollToThread(true)
      handleScrollToThread()
    }
  }, [handleScrollToThread, hasComments, setStatus, status, threadId])

  useEffect(() => {
    if (threadId) {
      handleScrollToThread()
    }
  }, [comments.data.open, handleScrollToThread, props.path, threadId])

  const handleCommentAdd = useCallback(() => {
    if (value) {
      // Since this is a new comment, we generate a new thread ID
      const newThreadId = uuid()

      const nextComment = {
        fieldPath: pathToString(props.path),
        message: value,
        parentCommentId: undefined,
        status: 'open',
        threadId: newThreadId,
      } satisfies CommentCreatePayload

      create.execute(nextComment)

      openInspector(COMMENTS_INSPECTOR_NAME)

      // If a comment is added to a field when viewing resolved comments, we switch
      // to open comments and scroll to the comment that was just added
      setStatus('open')
      setValue(null)
    }
  }, [create, openInspector, props.path, setStatus, value])

  const handleDiscard = useCallback(() => {
    setValue(null)
  }, [])

  const internalComments: FieldProps['__internal_comments'] = useMemo(
    () => ({
      button: currentUser && (
        <CommentFieldButton
          count={Number(count)}
          currentUser={currentUser}
          hasComments={hasComments}
          onChange={setValue}
          onClick={handleClick}
          onCommentAdd={handleCommentAdd}
          onDiscardEdit={handleDiscard}
          onOpenChange={setOpen}
          openInspector={openInspector}
          value={value}
        />
      ),
      hasComments,
      isAddingComment: open,
    }),
    [
      currentUser,
      count,
      hasComments,
      handleCommentAdd,
      handleDiscard,
      openInspector,
      value,
      handleClick,
      open,
    ],
  )

  return props.renderDefault({
    ...props,
    // eslint-disable-next-line camelcase
    __internal_comments: internalComments,
  })
}
