import {Card, useClickOutsideEvent} from '@sanity/ui'
import {cloneElement, useCallback, useMemo, useRef, useState} from 'react'

import {Popover, type PopoverProps} from '../../../../ui-components'
import {type TFunction, useTranslation} from '../../../i18n'
import {commentsLocaleNamespace} from '../../i18n'
import {type CommentReactionOption, type CommentsUIMode} from '../../types'
import {CommentReactionsMenu} from './CommentReactionsMenu'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

export interface CommentReactionsMenuButtonProps {
  mode: CommentsUIMode
  onMenuClose?: () => void
  onMenuOpen?: () => void
  onSelect: (option: CommentReactionOption) => void
  options: CommentReactionOption[]
  readOnly?: boolean
  renderMenuButton: (props: {
    open: boolean
    tooltipContent: string
    t: TFunction
  }) => React.JSX.Element
}

export function CommentReactionsMenuButton(props: CommentReactionsMenuButtonProps) {
  const {onMenuClose, onMenuOpen, onSelect, options, readOnly, renderMenuButton, mode} = props
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const [open, setOpen] = useState<boolean>(false)
  const {t} = useTranslation(commentsLocaleNamespace)

  const handleClick = useCallback(() => {
    const next = !open
    setOpen(next)

    if (next) {
      onMenuOpen?.()
    } else {
      onMenuClose?.()
    }
  }, [onMenuClose, onMenuOpen, open])

  const handleClose = useCallback(() => {
    if (!open) return

    setOpen(false)
    onMenuClose?.()
  }, [open, onMenuClose])

  const handleCloseAndFocus = useCallback(() => {
    if (!open) return

    handleClose()
    buttonElement?.focus()
  }, [buttonElement, handleClose, open])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const {key, shiftKey} = event

      if ((shiftKey && key === 'Tab') || key === 'Escape' || key === 'Tab') {
        handleCloseAndFocus()
      }
    },
    [handleCloseAndFocus],
  )

  useClickOutsideEvent(handleClose, () => [popoverRef.current, buttonElement])

  const handleSelect = useCallback(
    (option: CommentReactionOption) => {
      onSelect(option)
      handleClose()
    },
    [handleClose, onSelect],
  )

  const button = useMemo(() => {
    // Get the button element from the renderMenuButton function.
    const btn = renderMenuButton({
      open,
      tooltipContent:
        mode === 'upsell'
          ? t('list-item.context-menu-add-reaction-upsell')
          : t('list-item.context-menu-add-reaction'),
      t,
    })

    // Clone the button element and add the necessary props.
    return cloneElement(btn, {
      'aria-expanded': open,
      'aria-haspopup': 'true',
      'disabled': readOnly || mode === 'upsell',
      'id': 'reactions-menu-button',
      'onClick': handleClick,
      'ref': setButtonElement,
    })
  }, [handleClick, open, readOnly, renderMenuButton, t, mode])

  const popoverContent = (
    <Card
      aria-labelledby="reactions-menu-button"
      onKeyDown={handleKeyDown}
      padding={1}
      radius={3}
      tone="default"
    >
      <CommentReactionsMenu onSelect={handleSelect} options={options} />
    </Card>
  )

  return (
    <Popover
      constrainSize
      content={popoverContent}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      open={open}
      placement="bottom"
      portal
      ref={popoverRef}
      tone="default"
    >
      {button}
    </Popover>
  )
}
