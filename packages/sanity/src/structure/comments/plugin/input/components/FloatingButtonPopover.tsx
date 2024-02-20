import {AddCommentIcon} from '@sanity/icons'
import {Box, ConditionalWrapper, Text, useClickOutside} from '@sanity/ui'
import {motion, type Variants} from 'framer-motion'
import {useState} from 'react'
import styled from 'styled-components'

import {Button, Popover, type PopoverProps, Tooltip} from '../../../../../ui-components'

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
const TMP_TOOLTIP_COPY = `Overlapping comments aren't supported yet. Please choose a different segment or join the existing thread.`

function ConditionalWrapperContent(content: React.ReactNode) {
  return (
    <Tooltip
      content={
        <Box style={{width: 200}} padding={1}>
          <Text size={1}>{TMP_TOOLTIP_COPY}</Text>
        </Box>
      }
    >
      <div>{content}</div>
    </Tooltip>
  )
}

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

  const content = (
    <ConditionalWrapper condition={disabled} wrapper={ConditionalWrapperContent}>
      <Button
        data-testid="inline-comment-button"
        disabled={disabled}
        icon={AddCommentIcon}
        mode="bleed"
        onClick={onClick}
        ref={setPopoverElement}
        text={TMP_BUTTON_COPY}
      />
    </ConditionalWrapper>
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
