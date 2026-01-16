import {AddCommentIcon} from '@sanity/icons'
import {Box, useClickOutsideEvent} from '@sanity/ui'
import {motion, type Variants} from 'motion/react'
import {useRef} from 'react'
import {styled} from 'styled-components'

import {Button, Popover, type PopoverProps} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {CommentDisabledIcon} from '../../../components'
import {commentsLocaleNamespace} from '../../../i18n'

const MotionPopover = styled(motion.create(Popover))`
  user-select: none;
`

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom', 'top']

const VARIANTS: Variants = {
  hidden: {opacity: 0, y: -4},
  visible: {opacity: 1, y: 0},
}

interface FloatingButtonPopoverProps {
  disabled: boolean
  onClick: () => void
  onClickOutside: (e: MouseEvent) => void
  referenceElement: PopoverProps['referenceElement']
}

export function FloatingButtonPopover(props: FloatingButtonPopoverProps) {
  const {disabled, onClick, onClickOutside, referenceElement} = props
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const {t} = useTranslation(commentsLocaleNamespace)

  useClickOutsideEvent(onClickOutside, () => [buttonRef.current])

  const disabledText = t('inline-add-comment-button.disabled-overlap-title')
  const enabledText = t('inline-add-comment-button.title')
  const text = disabled ? disabledText : enabledText

  // Wrap the button in a non-editable container to prevent it from being
  // treated as editable content when rendered near Portable Text editors.
  // Note: contentEditable={false} must be on the content, not the Popover itself,
  // as applying it to the portal container can interfere with click event propagation.
  const content = (
    <Box contentEditable={false}>
      <Button
        data-testid="inline-comment-button"
        disabled={disabled}
        icon={disabled ? CommentDisabledIcon : AddCommentIcon}
        mode="bleed"
        onClick={onClick}
        ref={buttonRef}
        text={text}
      />
    </Box>
  )

  return (
    <MotionPopover
      animate="visible"
      content={content}
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
