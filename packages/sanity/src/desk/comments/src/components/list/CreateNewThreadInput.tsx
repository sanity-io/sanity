import {CurrentUser} from '@sanity/types'
import {EMPTY_ARRAY} from '@sanity/ui-workshop'
import React, {useState, useCallback, useRef, useMemo} from 'react'
import {CommentMessage, MentionOptionsHookValue} from '../../types'
import {CommentInput, CommentInputHandle} from '../pte'
import {hasCommentMessageValue} from '../../helpers'

interface CreateNewThreadInputProps {
  currentUser: CurrentUser
  mentionOptions: MentionOptionsHookValue
  onEditDiscard?: () => void
  onNewThreadCreate: (payload: CommentMessage) => void
  openButtonElement: HTMLButtonElement | null
}

export function CreateNewThreadInput(props: CreateNewThreadInputProps) {
  const [value, setValue] = useState<CommentMessage>(EMPTY_ARRAY)
  const {currentUser, mentionOptions, onNewThreadCreate, onEditDiscard, openButtonElement} = props

  const commentInputHandle = useRef<CommentInputHandle | null>(null)

  const handleSubmit = useCallback(() => {
    onNewThreadCreate?.(value)
    setValue(EMPTY_ARRAY)
  }, [onNewThreadCreate, value])

  const hasValue = useMemo(() => hasCommentMessageValue(value), [value])

  const startDiscard = useCallback(() => {
    if (!hasValue) {
      onEditDiscard?.()
      openButtonElement?.focus()
      return
    }

    commentInputHandle.current?.discardDialogController.open()
  }, [hasValue, onEditDiscard, openButtonElement])

  const confirmDiscard = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
    setValue(EMPTY_ARRAY)
    onEditDiscard?.()
    openButtonElement?.focus()
  }, [onEditDiscard, openButtonElement])

  const cancelDiscard = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
    commentInputHandle.current?.focus()
  }, [])

  return (
    <CommentInput
      currentUser={currentUser}
      focusOnMount
      mentionOptions={mentionOptions}
      onChange={setValue}
      onDiscardCancel={cancelDiscard}
      onDiscardConfirm={confirmDiscard}
      onEscapeKeyDown={startDiscard}
      onSubmit={handleSubmit}
      ref={commentInputHandle}
      value={value}
    />
  )
}
