import {type CurrentUser, type PortableTextBlock} from '@sanity/types'
import {Stack, useClickOutsideEvent} from '@sanity/ui'
import {motion, type Variants} from 'motion/react'
import {useCallback, useEffect, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {Popover, type PopoverProps} from '../../../../../ui-components'
import {CommentInput, type CommentInputHandle, type CommentInputProps} from '../../../components'
import {hasCommentMessageValue} from '../../../helpers'
import {type CommentMessage} from '../../../types'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom', 'top']

const MotionPopover = motion.create(Popover)

const RootStack = styled(Stack)`
  width: 250px;
`

const VARIANTS: Variants = {
  hidden: {opacity: 0},
  visible: {opacity: 1},
}

interface InlineCommentInputPopoverProps {
  currentUser: CurrentUser
  mentionOptions: CommentInputProps['mentionOptions']
  onClickOutside: () => void
  onDiscardConfirm: CommentInputProps['onDiscardConfirm']
  onSubmit: (message: CommentMessage) => void
  onUnmount?: () => void
  referenceElement?: HTMLElement | null
}

export function InlineCommentInputPopover(props: InlineCommentInputPopoverProps) {
  const {
    currentUser,
    mentionOptions,
    onClickOutside,
    onDiscardConfirm,
    onSubmit,
    onUnmount,
    referenceElement,
  } = props

  const [value, setValue] = useState<CommentMessage>(null)
  const valueRef = useRef<CommentMessage>(null)

  const commentInputRef = useRef<CommentInputHandle | null>(null)
  const contentElementRef = useRef<HTMLDivElement | null>(null)

  const handleChange = useCallback((nextValue: PortableTextBlock[]) => {
    setValue(nextValue)
    valueRef.current = nextValue
  }, [])

  const handleSubmit = useCallback(() => {
    onSubmit(valueRef.current)
  }, [onSubmit])

  const handleDiscardConfirm = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
    onDiscardConfirm()
  }, [onDiscardConfirm])

  const handleDiscardCancel = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
  }, [])

  useClickOutsideEvent(
    () => {
      const hasValue = hasCommentMessageValue(valueRef.current)

      if (hasValue) {
        commentInputRef.current?.discardDialogController.open()
        return
      }

      onClickOutside()
    },
    () => [contentElementRef.current],
  )

  useEffect(() => {
    return () => {
      onUnmount?.()
    }
  }, [onUnmount])

  const content = (
    <RootStack padding={2} ref={contentElementRef}>
      <CommentInput
        currentUser={currentUser}
        focusLock
        focusOnMount
        mentionOptions={mentionOptions}
        onChange={handleChange}
        onDiscardCancel={handleDiscardCancel}
        onDiscardConfirm={handleDiscardConfirm}
        onSubmit={handleSubmit}
        ref={commentInputRef}
        value={value}
      />
    </RootStack>
  )

  return (
    <MotionPopover
      animate="visible"
      content={content}
      data-ui="InlineCommentInputPopover"
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      initial="hidden"
      open
      placement="bottom"
      portal
      referenceElement={referenceElement}
      variants={VARIANTS}
    />
  )
}
