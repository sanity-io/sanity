import {CurrentUser} from '@sanity/types'
import {useClickOutside, Stack} from '@sanity/ui'
import {useCallback, useRef} from 'react'
import {AnimatePresence, Variants, motion} from 'framer-motion'
import styled from 'styled-components'
import {
  CommentInputProps,
  CommentInput,
  CommentInputHandle,
  hasCommentMessageValue,
} from '../../../src'
import {Popover} from '../../../../../ui-components'

const MotionPopover = motion(Popover)

const RootStack = styled(Stack)`
  width: 250px;
`

const VARIANTS: Variants = {
  hidden: {opacity: 0, y: -4},
  visible: {opacity: 1, y: 0},
}

interface InlineCommentInputPopoverProps {
  currentUser: CurrentUser
  mentionOptions: CommentInputProps['mentionOptions']
  onChange: CommentInputProps['onChange']
  onClickOutside: () => void
  onDiscardConfirm: CommentInputProps['onDiscardConfirm']
  onSubmit: CommentInputProps['onSubmit']
  open: boolean
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
    open,
    referenceElement,
    value,
  } = props

  const commentInputRef = useRef<CommentInputHandle | null>(null)
  const popoverElementRef = useRef<HTMLDivElement | null>(null)

  const handleDiscardConfirm = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
    onDiscardConfirm()
  }, [onDiscardConfirm])

  const handleDiscardCancel = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
  }, [])

  useClickOutside(() => {
    if (hasCommentMessageValue(value)) {
      commentInputRef.current?.discardDialogController.open()
      return
    }

    onClickOutside()
  }, [popoverElementRef.current])

  const content = (
    <RootStack padding={2}>
      <CommentInput
        currentUser={currentUser}
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

  // We use `AnimatePresence` so that there's a slight delay before the popover is rendered.
  // This is because the bounding box from the `referenceElement` is not always stable, and
  // we want to avoid the popover jumping around on initial render.
  return (
    <AnimatePresence mode="wait">
      {open && (
        <MotionPopover
          animate="visible"
          content={content}
          data-ui="InlineCommentInputPopover"
          fallbackPlacements={['bottom']}
          initial="hidden"
          layout
          open
          placement="bottom"
          portal
          ref={popoverElementRef}
          referenceElement={referenceElement}
          variants={VARIANTS}
        />
      )}
    </AnimatePresence>
  )
}
