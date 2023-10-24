import React, {useCallback, useMemo, useRef, useState} from 'react'
import {
  Box,
  Button,
  Flex,
  Popover,
  Stack,
  Text,
  Tooltip,
  TooltipProps,
  useClickOutside,
} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {
  CommentMessage,
  CommentInput,
  CommentInputHandle,
  hasCommentMessageValue,
  AddCommentIcon,
  CommentIcon,
  MentionOptionsHookValue,
} from '../../src'
import {CurrentUser, PortableTextBlock} from 'sanity'

const TOOLTIP_DELAY: TooltipProps['delay'] = {open: 500}

const TooltipText = styled(Text)`
  width: max-content;
`

const ContentStack = styled(Stack)`
  width: 320px;
`

const StyledPopover = styled(Popover)(({theme}) => {
  const {space} = theme.sanity
  const offsetX = space[1] * 2
  const offsetY = -3

  return css`
    /* &[data-placement='right-start'] {
      transform: translate(${offsetX}px, ${offsetY}px);
    }

    &[data-placement='left-start'] {
      transform: translate(-${offsetX}px, ${offsetY}px);
    } */
  `
})

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
    open,
    setOpen,
    value,
  } = props
  const [mentionMenuOpen, setMentionMenuOpen] = useState<boolean>(false)
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
    if (mentionMenuOpen) return

    if (!hasValue) {
      closePopover()
      return
    }

    commentInputHandle.current?.discardDialogController.open()
  }, [closePopover, hasValue, mentionMenuOpen])

  const handleDiscardCancel = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
  }, [])

  const handleDiscardConfirm = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
    closePopover()
    onDiscard()
  }, [closePopover, onDiscard])

  useClickOutside(startDiscard, [popoverElement])

  const placeholder = (
    <>
      Add comment to <b>{fieldTitle}</b>
    </>
  )

  if (!hasComments) {
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
          onEscapeKeyDown={startDiscard}
          onMentionMenuOpenChange={setMentionMenuOpen}
          onSubmit={handleSubmit}
          placeholder={placeholder}
          readOnly={isRunningSetup}
          ref={commentInputHandle}
          value={value}
        />
      </ContentStack>
    )

    return (
      <StyledPopover
        constrainSize
        content={content}
        fallbackPlacements={['left-start']}
        open={open}
        placement="bottom-end"
        portal
        ref={setPopoverElement}
      >
        <div>
          <Tooltip
            delay={TOOLTIP_DELAY}
            disabled={open}
            portal
            placement="top"
            content={
              <Box padding={2}>
                <Text size={1}>Add comment</Text>
              </Box>
            }
          >
            <Button
              aria-label="Add comment"
              disabled={isRunningSetup}
              fontSize={1}
              icon={AddCommentIcon}
              mode="bleed"
              onClick={onClick}
              padding={2}
              selected={open}
            />
          </Tooltip>
        </div>
      </StyledPopover>
    )
  }

  return (
    <Tooltip
      portal
      placement="top"
      content={
        <Box padding={2} sizing="border">
          <TooltipText size={1}>View comment{count > 1 ? 's' : ''}</TooltipText>
        </Box>
      }
      delay={TOOLTIP_DELAY}
      fallbackPlacements={['bottom']}
    >
      <Button aria-label="Open comments" mode="bleed" onClick={onClick} padding={2}>
        <Flex align="center" gap={2}>
          <Text size={1}>
            <CommentIcon />
          </Text>
          <Text size={0}>{count > 9 ? '9+' : count}</Text>
        </Flex>
      </Button>
    </Tooltip>
  )
}
