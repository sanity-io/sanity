import {AddCommentIcon} from '@sanity/icons'
import {useClickOutside} from '@sanity/ui'
import {motion, type Variants} from 'framer-motion'
import {useState} from 'react'
import styled from 'styled-components'

import {Button, Popover, type PopoverProps} from '../../../../../ui-components'

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
  onClickOutside: (e: MouseEvent) => void
  referenceElement: PopoverProps['referenceElement']
}

export function FloatingButtonPopover(props: FloatingButtonPopoverProps) {
  const {onClick, onClickOutside, referenceElement} = props

  const [popoverElement, setPopoverElement] = useState<HTMLButtonElement | null>(null)

  useClickOutside(onClickOutside, [popoverElement])

  const content = (
    <Button
      icon={AddCommentIcon}
      ref={setPopoverElement}
      mode="bleed"
      onClick={onClick}
      // TODO: localize
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
      referenceElement={referenceElement}
      variants={VARIANTS}
    />
  )
}
