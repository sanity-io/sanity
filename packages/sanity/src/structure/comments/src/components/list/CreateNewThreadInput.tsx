import type {CurrentUser} from '@sanity/types'
import React, {useState, useCallback, useRef, useMemo} from 'react'
import type {CommentMessage, MentionOptionsHookValue} from '../../types'
import {CommentInput, CommentInputHandle, CommentInputProps} from '../pte'
import {commentsLocaleNamespace} from '../../../i18n'
import {hasCommentMessageValue} from '../../helpers'
import {EMPTY_ARRAY, Translate, useTranslation} from 'sanity'

interface CreateNewThreadInputProps {
  currentUser: CurrentUser
  fieldTitle: string
  mentionOptions: MentionOptionsHookValue
  onBlur?: CommentInputProps['onBlur']
  onFocus?: CommentInputProps['onFocus']
  onKeyDown?: (event: React.KeyboardEvent<Element>) => void
  onNewThreadCreate: (payload: CommentMessage) => void
  readOnly?: boolean
}

export function CreateNewThreadInput(props: CreateNewThreadInputProps) {
  const {
    currentUser,
    fieldTitle,
    mentionOptions,
    onBlur,
    onFocus,
    onKeyDown,
    onNewThreadCreate,
    readOnly,
  } = props
  const {t} = useTranslation(commentsLocaleNamespace)

  const [value, setValue] = useState<CommentMessage>(EMPTY_ARRAY)
  const commentInputHandle = useRef<CommentInputHandle | null>(null)

  const handleSubmit = useCallback(() => {
    onNewThreadCreate?.(value)
    setValue(EMPTY_ARRAY)
  }, [onNewThreadCreate, value])

  const hasValue = useMemo(() => hasCommentMessageValue(value), [value])

  const startDiscard = useCallback(() => {
    if (!hasValue) {
      return
    }
    commentInputHandle.current?.discardDialogController.open()
  }, [hasValue])

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<Element>) => {
      // Don't act if the input already prevented this event
      if (event.isDefaultPrevented()) {
        return
      }
      // Discard the input text
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        startDiscard()
      }
      // Call parent handler
      if (onKeyDown) onKeyDown(event)
    },
    [onKeyDown, startDiscard],
  )

  const confirmDiscard = useCallback(() => {
    setValue(EMPTY_ARRAY)
    commentInputHandle.current?.discardDialogController.close()
    commentInputHandle.current?.focus()
  }, [])

  const cancelDiscard = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
  }, [])

  const placeholder = (
    <Translate t={t} i18nKey="placeholder-add-comment-to-field" values={{field: fieldTitle}} />
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
      onKeyDown={handleInputKeyDown}
      onFocus={onFocus}
      onSubmit={handleSubmit}
      placeholder={placeholder}
      readOnly={readOnly}
      ref={commentInputHandle}
      value={value}
    />
  )
}
