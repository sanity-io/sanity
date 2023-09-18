import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {uuid} from '@sanity/uuid'
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

  const count = useFieldCommentsCount({path: props.path})
  const hasComments = Boolean(count > 0)

  const [shouldScrollToThread, setShouldScrollToThread] = useState<boolean>(false)

  const handleClick = useCallback(() => {
    if (hasComments && status === 'resolved') {
      setStatus('open')
    }

    setShouldScrollToThread(true)
  }, [hasComments, setStatus, status])

  useEffect(() => {
    if (status === 'open' && inspector?.name === COMMENTS_INSPECTOR_NAME && shouldScrollToThread) {
      const threadId = comments.data.open.find(
        (comment) => comment.target.path.field === props.path.toString(),
      )?.threadId

      // Find the node in the DOM
      const node = document.querySelector(`[data-thread-id="${threadId}"]`)

      // Scroll to the node
      if (node) {
        requestAnimationFrame(() => {
          node.scrollIntoView({behavior: 'smooth', block: 'start'})
        })
      }

      // Reset shouldScrollToThread to false after performing the scroll action
      setShouldScrollToThread(false)
    }
  }, [status, inspector?.name, props.path, shouldScrollToThread, comments.data.open])

  const handleCommentAdd = useCallback(() => {
    if (value) {
      const nextComment = {
        fieldPath: pathToString(props.path),
        message: value,
        parentCommentId: undefined,
        status: 'open',
        // Since this is a new comment, we generate a new thread ID
        threadId: uuid(),
      } satisfies CommentCreatePayload

      create.execute(nextComment)

      setValue(null)
    }
  }, [create, props.path, value])

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
