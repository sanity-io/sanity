import React, {useCallback, useMemo, useRef, useState} from 'react'
import {
  Flex,
  Popover,
  Stack,
  Text,
  useClickOutside,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Button as SanityUIButton, // Button with specific styling for the children
} from '@sanity/ui'
import styled from 'styled-components'
import {
  CommentMessage,
  CommentInput,
  CommentInputHandle,
  hasCommentMessageValue,
  AddCommentIcon,
  CommentIcon,
  MentionOptionsHookValue,
} from '../../src'
import {Button, Tooltip} from '../../../../ui'
import {CurrentUser, PortableTextBlock} from 'sanity'

const ContentStack = styled(Stack)`
  width: 320px;
`

interface CommentFieldButtonProps {
  count: number
  currentUser: CurrentUser
  fieldTitle: string
  isRunningSetup: boolean
  mentionOptions: MentionOptionsHookValue
  onChange: (value: PortableTextBlock[]) => void
  onClick?: () => void
  onCommentAdd: () => void
  onDiscard: () => void
  onInputKeyDown?: (event: React.KeyboardEvent<Element>) => void
  open: boolean
  setOpen: (open: boolean) => void
  value: CommentMessage
}

export function CommentFieldButton(props: CommentFieldButtonProps) {
  const {
    count,
    currentUser,
    fieldTitle,
    isRunningSetup,
    mentionOptions,
    onChange,
    onClick,
    onCommentAdd,
    onDiscard,
    onInputKeyDown,
    open,
    setOpen,
    value,
  } = props
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const commentInputHandle = useRef<CommentInputHandle | null>(null)
  const hasComments = Boolean(count > 0)

  const closePopover = useCallback(() => setOpen(false), [setOpen])

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
      // Discard the input text
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        startDiscard()
      }
      // Call parent handler
      if (onInputKeyDown) onInputKeyDown(event)
    },
    [onInputKeyDown, startDiscard],
  )

  const handleDiscardCancel = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
  }, [])

  const handleDiscardConfirm = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
    closePopover()
    onDiscard()
  }, [closePopover, onDiscard])

  useClickOutside(startDiscard, [popoverElement])

  if (!hasComments) {
    const placeholder = (
      <>
        Add comment to <b>{fieldTitle}</b>
      </>
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
          readOnly={isRunningSetup}
          ref={commentInputHandle}
          value={value}
        />
      </ContentStack>
    )

    return (
      <Popover
        constrainSize
        content={content}
        fallbackPlacements={['left-start']}
        open={open}
        placement="bottom-end"
        portal
        ref={setPopoverElement}
      >
        <div>
          <Button
            aria-label="Add comment"
            disabled={isRunningSetup}
            icon={AddCommentIcon}
            mode="bleed"
            onClick={onClick}
            size="small"
            selected={open}
            tooltipProps={{
              disabled: open,
              portal: true,
              placement: 'top',
              content: 'Add comment',
            }}
          />
        </div>
      </Popover>
    )
  }

  return (
    <Tooltip portal placement="top" content={`View comment${count > 1 ? 's' : ''}`}>
      <SanityUIButton
        aria-label="Open comments"
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
