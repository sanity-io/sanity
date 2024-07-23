import {AddCommentIcon, CommentIcon} from '@sanity/icons'
import {type CurrentUser, type PortableTextBlock} from '@sanity/types'
import {
  // eslint-disable-next-line no-restricted-imports
  Button as SanityUIButton,
  Flex,
  Stack,
  Text,
  useClickOutsideEvent,
} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {Button, Popover, Tooltip} from '../../../../ui-components'
import {type UserListWithPermissionsHookValue} from '../../../hooks'
import {Translate, useTranslation} from '../../../i18n'
import {CommentInput, type CommentInputHandle} from '../../components'
import {hasCommentMessageValue} from '../../helpers'
import {commentsLocaleNamespace} from '../../i18n'
import {type CommentMessage} from '../../types'

const ContentStack = styled(Stack)`
  width: 320px;
`

interface CommentsFieldButtonProps {
  count: number
  currentUser: CurrentUser
  fieldTitle: string
  isCreatingDataset: boolean
  mentionOptions: UserListWithPermissionsHookValue
  onChange: (value: PortableTextBlock[]) => void
  onClick?: () => void
  onClose: () => void
  onCommentAdd: () => void
  onDiscard: () => void
  onInputKeyDown?: (event: React.KeyboardEvent<Element>) => void
  open: boolean
  value: CommentMessage
}

export function CommentsFieldButton(props: CommentsFieldButtonProps) {
  const {
    count,
    currentUser,
    fieldTitle,
    isCreatingDataset,
    mentionOptions,
    onChange,
    onClick,
    onClose,
    onCommentAdd,
    onDiscard,
    onInputKeyDown,
    open,
    value,
  } = props
  const {t} = useTranslation(commentsLocaleNamespace)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [addCommentButtonElement, setAddCommentButtonElement] = useState<HTMLButtonElement | null>(
    null,
  )
  const commentInputHandle = useRef<CommentInputHandle | null>(null)
  const hasComments = Boolean(count > 0)

  const closePopover = useCallback(() => {
    if (!open) return
    onClose()
    addCommentButtonElement?.focus()
  }, [addCommentButtonElement, open, onClose])

  const handleSubmit = useCallback(() => {
    onCommentAdd()
    closePopover()
  }, [closePopover, onCommentAdd])

  const hasValue = useMemo(() => hasCommentMessageValue(value), [value])

  const startDiscard = useCallback(() => {
    if (!hasValue) {
      closePopover()
      return
    }

    commentInputHandle.current?.discardDialogController.open()
  }, [closePopover, hasValue])

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<Element>) => {
      // Don't act if the input already prevented this event
      if (event.isDefaultPrevented()) {
        return
      }

      // Call parent handler
      if (onInputKeyDown) onInputKeyDown(event)
    },
    [onInputKeyDown],
  )

  const handleDiscardCancel = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
  }, [])

  const handleDiscardConfirm = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
    closePopover()
    onDiscard()
  }, [closePopover, onDiscard])

  const handlePopoverKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        startDiscard()
      }
    },
    [startDiscard],
  )

  useClickOutsideEvent(!open && startDiscard, () => [popoverRef.current])

  if (!hasComments) {
    const placeholder = (
      <Translate
        t={t}
        i18nKey="compose.add-comment-input-placeholder"
        values={{field: fieldTitle}}
      />
    )

    const content = (
      <ContentStack padding={2} space={4}>
        <CommentInput
          currentUser={currentUser}
          focusLock
          focusOnMount
          mentionOptions={mentionOptions}
          onChange={onChange}
          onDiscardCancel={handleDiscardCancel}
          onDiscardConfirm={handleDiscardConfirm}
          onKeyDown={handleInputKeyDown}
          onSubmit={handleSubmit}
          placeholder={placeholder}
          readOnly={isCreatingDataset}
          ref={commentInputHandle}
          value={value}
        />
      </ContentStack>
    )

    return (
      <Popover
        constrainSize
        content={content}
        fallbackPlacements={['bottom-end']}
        open={open}
        placement="right-start"
        portal
        ref={popoverRef}
        onKeyDown={handlePopoverKeyDown}
      >
        <div>
          <Button
            aria-label={t('field-button.aria-label-add')}
            disabled={isCreatingDataset}
            icon={AddCommentIcon}
            mode="bleed"
            onClick={onClick}
            ref={setAddCommentButtonElement}
            selected={open}
            tooltipProps={{
              content: t('field-button.title'),
              placement: 'top',
            }}
          />
        </div>
      </Popover>
    )
  }

  return (
    <Tooltip portal placement="top" content={t('field-button.content', {count})}>
      <SanityUIButton
        aria-label={t('field-button.aria-label-open')}
        mode="bleed"
        onClick={onClick}
        padding={2}
        space={2}
      >
        <Flex align="center" gap={2}>
          <Text size={1}>
            <CommentIcon />
          </Text>
          <Text size={0}>{count > 9 ? '9+' : count}</Text>
        </Flex>
      </SanityUIButton>
    </Tooltip>
  )
}
