import {AddCommentIcon} from '@sanity/icons'
import {useClickOutside} from '@sanity/ui'
import {motion, type Variants} from 'framer-motion'
import {useState} from 'react'
import styled from 'styled-components'

import {Button, Popover, type PopoverProps} from '../../../../../ui-components'
import {CommentDisabledIcon} from '../../../src'

const MotionPopover = styled(motion(Popover))`
  user-select: none;
`

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom', 'top']

const VARIANTS: Variants = {
  hidden: {opacity: 0, y: -4},
  visible: {opacity: 1, y: 0},
}

// TODO: Localize these strings
const TMP_BUTTON_COPY = 'Add comment'
const TMP_BUTTON_DISABLED_COPY = 'Comments cannot overlap'

interface FloatingButtonPopoverProps {
  disabled: boolean
  onClick: () => void
  onClickOutside: (e: MouseEvent) => void
  referenceElement: PopoverProps['referenceElement']
}

export function FloatingButtonPopover(props: FloatingButtonPopoverProps) {
  const {disabled, onClick, onClickOutside, referenceElement} = props
  const [popoverElement, setPopoverElement] = useState<HTMLButtonElement | null>(null)

  useClickOutside(onClickOutside, [popoverElement])

  const text = disabled ? TMP_BUTTON_DISABLED_COPY : TMP_BUTTON_COPY

  const content = (
    <Button
      data-testid="inline-comment-button"
      disabled={disabled}
      icon={disabled ? CommentDisabledIcon : AddCommentIcon}
      mode="bleed"
      onClick={onClick}
      ref={setPopoverElement}
      text={text}
    />
  )

  return (
    <MotionPopover
      animate="visible"
      content={content}
      contentEditable={false}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      initial="hidden"
      open
      padding={1}
      placement="bottom"
      portal
      referenceElement={referenceElement}
      variants={VARIANTS}
    />
  )
}
