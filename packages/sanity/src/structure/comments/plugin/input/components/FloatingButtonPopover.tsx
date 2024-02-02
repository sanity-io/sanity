import {AddCommentIcon} from '@sanity/icons'
import {Variants, motion} from 'framer-motion'
import styled from 'styled-components'
import {forwardRef} from 'react'
import {Button, Popover, PopoverProps} from '../../../../../ui-components'

const MotionPopover = styled(motion(Popover))`
  user-select: none;
`

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom', 'top']

const VARIANTS: Variants = {
  hidden: {opacity: 0, y: -4},
  visible: {opacity: 1, y: 0},
}

interface FloatingButtonPopoverProps {
  onClick: () => void
  referenceElement: PopoverProps['referenceElement']
}

export const FloatingButtonPopover = forwardRef(function FloatingButtonPopover(
  props: FloatingButtonPopoverProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {onClick, referenceElement} = props

  const content = (
    <Button
      icon={AddCommentIcon}
      mode="bleed"
      onClick={onClick}
      // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
      text="Add comment"
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
      ref={ref}
      referenceElement={referenceElement}
      variants={VARIANTS}
    />
  )
})
