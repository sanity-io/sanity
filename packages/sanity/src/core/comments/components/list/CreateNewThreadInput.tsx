import {type CurrentUser, type PortableTextBlock} from '@sanity/types'
import {useCallback, useMemo, useRef, useState} from 'react'

import {type UserListWithPermissionsHookValue} from '../../../hooks'
import {Translate, useTranslation} from '../../../i18n'
import {hasCommentMessageValue} from '../../helpers'
import {commentsLocaleNamespace} from '../../i18n'
import {type CommentMessage, type CommentsUIMode} from '../../types'
import {CommentInput, type CommentInputHandle, type CommentInputProps} from '../pte'

const EMPTY_PT_ARRAY: PortableTextBlock[] = []

interface CreateNewThreadInputProps {
  currentUser: CurrentUser
  fieldTitle: string
  mentionOptions: UserListWithPermissionsHookValue
  mode: CommentsUIMode
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
    mode,
    onBlur,
    onFocus,
    onKeyDown,
    onNewThreadCreate,
    readOnly,
  } = props
  const {t} = useTranslation(commentsLocaleNamespace)

  const [value, setValue] = useState<CommentMessage>(EMPTY_PT_ARRAY)
  const commentInputHandle = useRef<CommentInputHandle | null>(null)

  const handleSubmit = useCallback(() => {
    onNewThreadCreate?.(value)
    setValue(EMPTY_PT_ARRAY)
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
    setValue(EMPTY_PT_ARRAY)
    commentInputHandle.current?.discardDialogController.close()
    commentInputHandle.current?.focus()
  }, [])

  const cancelDiscard = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
  }, [])

  const placeholder =
    mode === 'upsell' ? (
      t('compose.add-comment-input-placeholder-upsell')
    ) : (
      <Translate
        t={t}
        i18nKey="compose.add-comment-input-placeholder"
        values={{field: fieldTitle}}
      />
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
      readOnly={readOnly || mode === 'upsell'}
      ref={commentInputHandle}
      value={value}
    />
  )
}
