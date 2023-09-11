import React, {useCallback, useMemo, useState} from 'react'
import {uuid} from '@sanity/uuid'
import {useDocumentPane} from '../../panes/document/useDocumentPane'
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
  const {openInspector} = useDocumentPane()
  const currentUser = useCurrentUser()
  const {create} = useComments()

  const count = useFieldCommentsCount({path: props.path})

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

  const comments: FieldProps['__internal_comments'] = useMemo(
    () => ({
      button: currentUser && (
        <CommentFieldButton
          count={Number(count)}
          currentUser={currentUser}
          hasComments={Boolean(count > 0)}
          onChange={setValue}
          onCommentAdd={handleCommentAdd}
          onDiscardEdit={handleDiscard}
          onOpenChange={setOpen}
          openInspector={openInspector}
          value={value}
        />
      ),
      hasComments: count > 0,
      isAddingComment: open,
    }),
    [currentUser, count, handleCommentAdd, handleDiscard, openInspector, value, open],
  )

  return props.renderDefault({
    ...props,
    // eslint-disable-next-line camelcase
    __internal_comments: comments,
  })
}
