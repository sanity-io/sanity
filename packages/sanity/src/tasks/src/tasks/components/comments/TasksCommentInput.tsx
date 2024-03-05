import {Card} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'

import {
  CommentInput,
  type CommentInputHandle,
  type CommentInputProps,
  hasCommentMessageValue,
} from '../../../../../structure/comments'

interface TasksCommentInputProps {
  currentUser: CommentInputProps['currentUser']
  mentionOptions: CommentInputProps['mentionOptions']
  onSubmit: (message: CommentInputProps['value']) => void
}

export function TasksCommentInput(props: TasksCommentInputProps) {
  const {mentionOptions, currentUser, onSubmit} = props
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

  return (
    <div style={{width: '100%'}}>
      <Card tone="transparent" radius={2} paddingY={1} paddingX={2}>
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
          placeholder="Add a comment..."
          ref={editorRef}
          value={value}
        />
      </Card>
    </div>
  )
}
