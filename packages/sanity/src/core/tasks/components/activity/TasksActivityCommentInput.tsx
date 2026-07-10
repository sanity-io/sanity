import {type PortableTextBlock} from '@sanity/types'
import {Card} from '@sanity/ui'
import {useCallback, useRef} from 'react'

import {
  CommentInput,
  type CommentInputHandle,
  type CommentInputProps,
  hasCommentMessageValue,
} from '../../../comments'
import {useTranslation} from '../../../i18n'
import {useTasksEnabled} from '../../context'
import {tasksLocaleNamespace} from '../../i18n'
import {ActivityItem} from './TasksActivityItem'

interface TasksCommentActivityInputProps {
  currentUser: CommentInputProps['currentUser']
  mentionOptions: CommentInputProps['mentionOptions']
  onSubmit: (message: PortableTextBlock[]) => void
}

export function TasksActivityCommentInput(props: TasksCommentActivityInputProps) {
  const {mentionOptions, currentUser, onSubmit} = props
  const {mode} = useTasksEnabled()
  const editorRef = useRef<CommentInputHandle>(null)

  const handleSubmit = useCallback(
    (nextValue: PortableTextBlock[]) => {
      if (hasCommentMessageValue(nextValue)) {
        onSubmit(nextValue)
      }
    },
    [onSubmit],
  )

  const handleDiscardCancel = useCallback(() => {
    editorRef.current?.discardDialogController.close()
  }, [])

  const handleDiscardConfirm = useCallback(() => {
    editorRef.current?.discardDialogController.close()
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()

      if (hasCommentMessageValue(editorRef.current?.getValue() ?? null)) {
        editorRef.current?.discardDialogController.open()
      } else {
        editorRef.current?.discardDialogController.close()
      }
    }
  }, [])
  const {t} = useTranslation(tasksLocaleNamespace)

  return (
    <ActivityItem userId={currentUser.id} avatarPaddingTop={3}>
      <Card tone="transparent" radius={3} padding={2}>
        <CommentInput
          withAvatar={false}
          currentUser={currentUser}
          expandOnFocus
          mentionOptions={mentionOptions}
          onDiscardConfirm={handleDiscardConfirm}
          onDiscardCancel={handleDiscardCancel}
          onKeyDown={handleKeyDown}
          onSubmit={handleSubmit}
          readOnly={mode === 'upsell'}
          placeholder={
            mode === 'upsell'
              ? t('panel.comment.placeholder.upsell')
              : t('panel.comment.placeholder')
          }
          ref={editorRef}
        />
      </Card>
    </ActivityItem>
  )
}
