import {AddCommentIcon} from '@sanity/icons'
import {useClickOutside} from '@sanity/ui'
import {motion, type Variants} from 'framer-motion'
import {useState} from 'react'
import {styled} from 'styled-components'

import {Button, Popover, type PopoverProps} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {CommentDisabledIcon} from '../../../components'
import {commentsLocaleNamespace} from '../../../i18n'

const MotionPopover = styled(motion(Popover))`
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
  const [popoverElement, setPopoverElement] = useState<HTMLButtonElement | null>(null)
  const {t} = useTranslation(commentsLocaleNamespace)

  useClickOutside(onClickOutside, [popoverElement])

  const disabledText = t('inline-add-comment-button.disabled-overlap-title')
  const enabledText = t('inline-add-comment-button.title')
  const text = disabled ? disabledText : enabledText

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
