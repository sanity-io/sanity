import {Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'

import {Dialog} from '../../../ui-components'
import {TextWithTone} from '../../components'
import {type TFunction, useTranslation} from '../../i18n'
import {commentsLocaleNamespace} from '../i18n'

function getDialogCopy(
  t: TFunction,
): Record<'thread' | 'comment', {title: string; body: string; confirmButtonText: string}> {
  return {
    thread: {
      title: t('delete-thread.title'),
      body: t('delete-thread.body'),
      confirmButtonText: t('delete-thread.confirm'),
    },
    comment: {
      title: t('delete-comment.title'),
      body: t('delete-comment.body'),
      confirmButtonText: t('delete-comment.confirm'),
    },
  }
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
  const {t} = useTranslation(commentsLocaleNamespace)
  const dialogCopy = getDialogCopy(t)
  const {title, body, confirmButtonText} = dialogCopy[isParent ? 'thread' : 'comment']

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

        {error && <TextWithTone tone="critical">{t('delete-dialog.error')}</TextWithTone>}
      </Stack>
    </Dialog>
  )
}
