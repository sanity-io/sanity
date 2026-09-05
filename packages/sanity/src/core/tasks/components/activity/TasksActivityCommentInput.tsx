import {type CurrentUser, type PortableTextBlock} from '@sanity/types'
import {Card} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'

import {
  CommentInput as CommentInputV2,
  type CommentInputHandle as CommentInputHandleV2,
  type CommentInputProps as CommentInputPropsV2,
} from '../../../comments-v2/components/pte/comment-input/CommentInput'
import {hasCommentMessageValue as hasCommentMessageValueV2} from '../../../comments-v2/helpers'
import {
  CommentInput,
  type CommentInputHandle,
  type CommentInputProps,
} from '../../../comments/components/pte/comment-input/CommentInput'
import {hasCommentMessageValue} from '../../../comments/helpers'
import {type UserListWithPermissionsHookValue} from '../../../hooks/useUserListWithPermissions'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../studio/workspace'
import {useTasksEnabled} from '../../context/enabled/useTasksEnabled'
import {tasksLocaleNamespace} from '../../i18n'
import {ActivityItem} from './TasksActivityItem'

interface TasksCommentActivityInputProps {
  currentUser: CurrentUser
  mentionOptions: UserListWithPermissionsHookValue
  onSubmit: (message: PortableTextBlock[] | null) => void
}

/**
 * Comments input in the activity log. Picks v1 or v2 from `beta.comments.v2`.
 */
export function TasksActivityCommentInput(props: TasksCommentActivityInputProps) {
  const {beta} = useWorkspace()

  return (
    <ActivityItem userId={props.currentUser.id} avatarPaddingTop={3}>
      <Card tone="transparent" radius={3} padding={2}>
        {beta?.comments?.v2 ? (
          <TasksActivityCommentInputV2 {...props} />
        ) : (
          <TasksActivityCommentInputV1 {...props} />
        )}
      </Card>
    </ActivityItem>
  )
}

/**
 * Comments input wired to the v1 comments context.
 */
function TasksActivityCommentInputV1(props: TasksCommentActivityInputProps) {
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
    (e: React.KeyboardEvent) => {
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
        mode === 'upsell' ? t('panel.comment.placeholder.upsell') : t('panel.comment.placeholder')
      }
      ref={editorRef}
      value={value}
    />
  )
}

/**
 * Comments input wired to the v2 comments context.
 */
function TasksActivityCommentInputV2(props: TasksCommentActivityInputProps) {
  const {mentionOptions, currentUser, onSubmit} = props
  const {mode} = useTasksEnabled()
  const [value, setValue] = useState<CommentInputPropsV2['value']>(null)
  const editorRef = useRef<CommentInputHandleV2>(null)

  const hasValue = useMemo(() => hasCommentMessageValueV2(value), [value])

  const handleChange = useCallback((nextValue: CommentInputPropsV2['value']) => {
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
    (e: React.KeyboardEvent) => {
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
    <CommentInputV2
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
        mode === 'upsell' ? t('panel.comment.placeholder.upsell') : t('panel.comment.placeholder')
      }
      ref={editorRef}
      value={value}
    />
  )
}
