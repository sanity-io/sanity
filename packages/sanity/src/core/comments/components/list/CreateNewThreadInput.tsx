import {CurrentUser} from '@sanity/types'
import {EMPTY_ARRAY} from '@sanity/ui-workshop'
import React, {useState, useCallback, forwardRef} from 'react'
import {MentionOptionsHookValue} from '../../hooks'
import {CommentMessage} from '../../types'
import {CommentInput, CommentInputHandle} from '../pte'

interface CreateNewThreadInputProps {
  currentUser: CurrentUser
  mentionOptions: MentionOptionsHookValue
  onNewThreadCreate: (payload: CommentMessage) => void
  onEditDiscard?: () => void
}

export const CreateNewThreadInput = forwardRef(function CreateNewThreadInput(
  props: CreateNewThreadInputProps,
  ref: React.ForwardedRef<CommentInputHandle>,
) {
  const [value, setValue] = useState<CommentMessage>(EMPTY_ARRAY)
  const {currentUser, mentionOptions, onNewThreadCreate, onEditDiscard} = props

  const handleSubmit = useCallback(() => {
    onNewThreadCreate?.(value)

    setValue(EMPTY_ARRAY)
  }, [onNewThreadCreate, value])

  const cancelEdit = useCallback(() => {
    setValue(EMPTY_ARRAY)
    onEditDiscard?.()
  }, [onEditDiscard])

  return (
    <CommentInput
      currentUser={currentUser}
      // expandOnFocus
      mentionOptions={mentionOptions}
      onChange={setValue}
      onEditDiscard={cancelEdit}
      onSubmit={handleSubmit}
      placeholder="Start a new thread…"
      ref={ref}
      value={value}
    />
  )
})
