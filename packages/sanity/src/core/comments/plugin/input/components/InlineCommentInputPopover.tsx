import {type CurrentUser} from '@sanity/types'
import {Stack, useClickOutsideEvent} from '@sanity/ui'
import {motion, type Variants} from 'framer-motion'
import {useCallback, useRef} from 'react'
import {styled} from 'styled-components'

import {Popover, type PopoverProps} from '../../../../../ui-components'
import {CommentInput, type CommentInputHandle, type CommentInputProps} from '../../../components'
import {hasCommentMessageValue} from '../../../helpers'

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
  onChange: CommentInputProps['onChange']
  onClickOutside: () => void
  onDiscardConfirm: CommentInputProps['onDiscardConfirm']
  onSubmit: CommentInputProps['onSubmit']
  referenceElement?: HTMLElement | null
  value: CommentInputProps['value']
}

export function InlineCommentInputPopover(props: InlineCommentInputPopoverProps) {
  const {
    currentUser,
    mentionOptions,
    onChange,
    onClickOutside,
    onDiscardConfirm,
    onSubmit,
    referenceElement,
    value,
  } = props

  const commentInputRef = useRef<CommentInputHandle | null>(null)
  const contentElementRef = useRef<HTMLDivElement | null>(null)

  const handleDiscardConfirm = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
    onDiscardConfirm()
  }, [onDiscardConfirm])

  const handleDiscardCancel = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
  }, [])

  useClickOutsideEvent(
    () => {
      const hasValue = hasCommentMessageValue(value)

      if (hasValue) {
        commentInputRef.current?.discardDialogController.open()
        return
      }

      onClickOutside()
    },
    () => [contentElementRef.current],
  )

  const content = (
    <RootStack padding={2} ref={contentElementRef}>
      <CommentInput
        currentUser={currentUser}
        focusLock
        focusOnMount
        mentionOptions={mentionOptions}
        onChange={onChange}
        onDiscardCancel={handleDiscardCancel}
        onDiscardConfirm={handleDiscardConfirm}
        onSubmit={onSubmit}
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
