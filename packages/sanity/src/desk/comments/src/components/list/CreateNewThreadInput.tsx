import {CurrentUser} from '@sanity/types'
import {EMPTY_ARRAY} from '@sanity/ui-workshop'
import React, {useState, useCallback, useRef, useMemo} from 'react'
import {CommentMessage, MentionOptionsHookValue} from '../../types'
import {CommentInput, CommentInputHandle, CommentInputProps} from '../pte'
import {hasCommentMessageValue} from '../../helpers'

interface CreateNewThreadInputProps {
  currentUser: CurrentUser
  fieldName: string
  mentionOptions: MentionOptionsHookValue
  onBlur?: CommentInputProps['onBlur']
  onEditDiscard?: () => void
  onFocus?: CommentInputProps['onFocus']
  onNewThreadCreate: (payload: CommentMessage) => void
  readOnly?: boolean
}

export function CreateNewThreadInput(props: CreateNewThreadInputProps) {
  const {
    currentUser,
    fieldName,
    mentionOptions,
    onBlur,
    onEditDiscard,
    onFocus,
    onNewThreadCreate,
    readOnly,
  } = props

  const [value, setValue] = useState<CommentMessage>(EMPTY_ARRAY)
  const commentInputHandle = useRef<CommentInputHandle | null>(null)

  const handleSubmit = useCallback(() => {
    onNewThreadCreate?.(value)
    setValue(EMPTY_ARRAY)
  }, [onNewThreadCreate, value])

  const hasValue = useMemo(() => hasCommentMessageValue(value), [value])

  const startDiscard = useCallback(() => {
    if (!hasValue) {
      onEditDiscard?.()
      return
    }

    commentInputHandle.current?.discardDialogController.open()
  }, [hasValue, onEditDiscard])

  const confirmDiscard = useCallback(() => {
    setValue(EMPTY_ARRAY)
    commentInputHandle.current?.reset()
    commentInputHandle.current?.discardDialogController.close()
    commentInputHandle.current?.focus()
    onEditDiscard?.()
  }, [onEditDiscard])

  const cancelDiscard = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
  }, [])

  const placeholder = (
    <>
      Add comment to <b>{fieldName}</b>
    </>
  )

  return (
    <CommentInput
      currentUser={currentUser}
      expandOnFocus
      mentionOptions={mentionOptions}
      onBlur={onBlur}
      onChange={setValue}
      onDiscardCancel={cancelDiscard}
      onDiscardConfirm={confirmDiscard}
      onEscapeKeyDown={startDiscard}
      onFocus={onFocus}
      onSubmit={handleSubmit}
      placeholder={placeholder}
      readOnly={readOnly}
      ref={commentInputHandle}
      value={value}
    />
  )
}
