import React, {cloneElement, useCallback, useMemo, useState} from 'react'
import {Card, useClickOutside} from '@sanity/ui'
import {CommentReactionOption, CommentReactionShortNames} from '../../types'
import {Popover, PopoverProps} from '../../../../../ui-components'
import {CommentReactionsMenu} from './CommentReactionsMenu'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

export interface CommentReactionsMenuButtonProps {
  onMenuClose?: () => void
  onMenuOpen?: () => void
  onSelect: (option: CommentReactionOption) => void
  options: CommentReactionOption[]
  readOnly?: boolean
  renderMenuButton: (props: {open: boolean}) => React.ReactElement
  selectedOptionNames: CommentReactionShortNames[]
}

export function CommentReactionsMenuButton(props: CommentReactionsMenuButtonProps) {
  const {
    onMenuClose,
    onMenuOpen,
    onSelect,
    options,
    readOnly,
    renderMenuButton,
    selectedOptionNames,
  } = props
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)

  const [open, setOpen] = useState<boolean>(false)

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
    buttonElement?.focus()
  }, [buttonElement, onMenuClose, open])

  const handleClickOutside = useCallback(handleClose, [handleClose])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const {key, shiftKey} = event

      if ((shiftKey && key === 'Tab') || key === 'Escape' || key === 'Tab') {
        handleClose()
      }
    },
    [handleClose],
  )

  useClickOutside(handleClickOutside, [popoverElement, buttonElement])

  const handleSelect = useCallback(
    (option: CommentReactionOption) => {
      onSelect(option)
      handleClose()
    },
    [handleClose, onSelect],
  )

  const button = useMemo(() => {
    // Get the button element from the renderMenuButton function.
    const btn = renderMenuButton({open})

    // Clone the button element and add the necessary props.
    return cloneElement(btn, {
      'aria-expanded': open,
      'aria-haspopup': 'true',
      disabled: readOnly,
      id: 'reactions-menu-button',
      onClick: handleClick,
      ref: setButtonElement,
    })
  }, [handleClick, open, readOnly, renderMenuButton])

  const popoverContent = (
    <Card
      aria-labelledby="reactions-menu-button"
      onKeyDown={handleKeyDown}
      padding={1}
      radius={3}
      tone="default"
    >
      <CommentReactionsMenu
        onSelect={handleSelect}
        options={options}
        selectedOptionNames={selectedOptionNames}
      />
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
      ref={setPopoverElement}
      tone="default"
    >
      {button}
    </Popover>
  )
}
