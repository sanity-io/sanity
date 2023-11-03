import {Dialog, Grid, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {Button} from '../../../../ui'
import {TextWithTone} from 'sanity'

const DIALOG_COPY: Record<
  'thread' | 'comment',
  {title: string; body: string; confirmButtonText: string}
> = {
  thread: {
    title: 'Delete this comment thread?',
    body: 'All comments in this thread will be deleted, and once deleted cannot be recovered.',
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
      header={title}
      id="delete-comment-dialog"
      onClose={onClose}
      width={0}
      footer={
        <Grid columns={2} padding={2} gap={2}>
          <Button text="Cancel" mode="ghost" onClick={onClose} />
          <Button
            loading={loading}
            onClick={handleDelete}
            text={confirmButtonText}
            tone="critical"
          />
        </Grid>
      }
    >
      <Stack padding={4} space={4}>
        <Text>{body}</Text>

        {error && (
          <TextWithTone tone="critical">
            An error occurred while deleting the comment. Please try again.
          </TextWithTone>
        )}
      </Stack>
    </Dialog>
  )
}
