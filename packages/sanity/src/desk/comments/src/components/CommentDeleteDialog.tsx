import {Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {Dialog} from '../../../../ui-components'
import {TextWithTone} from 'sanity'

const DIALOG_COPY: Record<
  'thread' | 'comment',
  {title: string; body: string; confirmButtonText: string}
> = {
  thread: {
    title: 'Delete this comment thread?',
    body: 'This comment and its replies will be deleted, and once deleted cannot be recovered.',
    confirmButtonText: 'Delete thread',
  },
  comment: {
    title: 'Delete this comment?',
    body: 'Once deleted, a comment cannot be recovered.',
    confirmButtonText: 'Delete comment',
  },
}

/**
 * @beta
 * @hidden
 */
export interface CommentDeleteDialogProps {
  commentId: string
  error: Error | null
  isParent: boolean
  loading: boolean
  onClose: () => void
  onConfirm: (id: string) => void
}

/**
 * @beta
 * @hidden
 */
export function CommentDeleteDialog(props: CommentDeleteDialogProps) {
  const {isParent, onClose, commentId, onConfirm, loading, error} = props
  const {title, body, confirmButtonText} = DIALOG_COPY[isParent ? 'thread' : 'comment']

  const handleDelete = useCallback(() => {
    onConfirm(commentId)
  }, [commentId, onConfirm])

  return (
    <Dialog
      footer={{
        cancelButton: {
          onClick: onClose,
        },
        confirmButton: {
          loading,
          onClick: handleDelete,
          text: confirmButtonText,
          tone: 'critical',
        },
      }}
      header={title}
      id="delete-comment-dialog"
      onClose={onClose}
      width={0}
    >
      <Stack space={4}>
        <Text size={1}>{body}</Text>

        {error && (
          <TextWithTone tone="critical">
            An error occurred while deleting the comment. Please try again.
          </TextWithTone>
        )}
      </Stack>
    </Dialog>
  )
}
