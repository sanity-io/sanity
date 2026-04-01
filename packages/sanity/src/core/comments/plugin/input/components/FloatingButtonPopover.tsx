import {AddCommentIcon} from '@sanity/icons'
import {useClickOutsideEvent} from '@sanity/ui'
import {motion, type Variants} from 'motion/react'
import {type MouseEvent, useCallback, useRef} from 'react'
import {styled} from 'styled-components'

import {Button, Popover, type PopoverProps} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
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

  const handleMouseDown = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  useClickOutsideEvent(onClickOutside, () => [buttonRef.current])

  const text = t('inline-add-comment-button.title')

  const content = (
    <Button
      data-testid="inline-comment-button"
      disabled={disabled}
      icon={AddCommentIcon}
      mode="bleed"
      onClick={onClick}
      ref={buttonRef}
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
      onMouseDown={handleMouseDown}
      open
      padding={1}
      placement="bottom"
      portal
      referenceElement={referenceElement}
      variants={VARIANTS}
    />
  )
}
