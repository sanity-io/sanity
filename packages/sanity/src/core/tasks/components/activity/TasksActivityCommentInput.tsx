import {Card} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'

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
  onSubmit: (message: CommentInputProps['value']) => void
}

export function TasksActivityCommentInput(props: TasksCommentActivityInputProps) {
  const {mentionOptions, currentUser, onSubmit} = props
  const {mode} = useTasksEnabled()
  const [value, setValue] = useState<CommentInputProps['value']>(null)
  const editorRef = useRef<CommentInputHandle>(null)

  const hasValue = useMemo(() => hasCommentMessageValue(value), [value])

  const handleChange = useCallback((nextValue: CommentInputProps['value']) => {
    setValue(nextValue)
  }, [])

  const handleSubmit = useCallback(() => {
    if (hasValue) {
      onSubmit(value)
      setValue(null)
    }
  }, [hasValue, onSubmit, value])

  const handleDiscardCancel = useCallback(() => {
    editorRef.current?.discardDialogController.close()
  }, [])

  const handleDiscardConfirm = useCallback(() => {
    editorRef.current?.discardDialogController.close()
    setValue(null)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<Element>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()

        if (hasValue) {
          editorRef.current?.discardDialogController.open()
        } else {
          editorRef.current?.discardDialogController.close()
          setValue(null)
        }
      }
    },
    [hasValue],
  )
  const {t} = useTranslation(tasksLocaleNamespace)

  return (
    <ActivityItem userId={currentUser.id} avatarPaddingTop={3}>
      <Card tone="transparent" radius={3} padding={2}>
        <CommentInput
          withAvatar={false}
          currentUser={currentUser}
          expandOnFocus
          mentionOptions={mentionOptions}
          onChange={handleChange}
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
          value={value}
        />
      </Card>
    </ActivityItem>
  )
}
