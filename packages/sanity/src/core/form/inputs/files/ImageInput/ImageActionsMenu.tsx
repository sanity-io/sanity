import React, {MouseEventHandler, ReactNode, useCallback, useEffect, useState} from 'react'
import {EllipsisHorizontalIcon, CropIcon} from '@sanity/icons'
import {
  Inline,
  Menu,
  Popover,
  TooltipDelayGroupProvider,
  useClickOutside,
  useGlobalKeyDown,
} from '@sanity/ui'
import styled from 'styled-components'
import {Button} from '../../../../../ui'
import {TOOLTIP_DELAY_PROPS} from '../../../../../ui/tooltip/constants'

export const MenuActionsWrapper = styled(Inline)`
  position: absolute;
  top: 0;
  right: 0;
`

interface ImageActionsMenuProps {
  children: ReactNode
  onEdit: MouseEventHandler<HTMLButtonElement>
  setHotspotButtonElement: (element: HTMLButtonElement | null) => void
  setMenuButtonElement: (element: HTMLButtonElement | null) => void
  showEdit: boolean
  isMenuOpen: boolean
  onMenuOpen: (flag: boolean) => void
}

export function ImageActionsMenu(props: ImageActionsMenuProps) {
  const {
    onEdit,
    children,
    showEdit,
    setHotspotButtonElement,
    setMenuButtonElement,
    onMenuOpen,
    isMenuOpen,
  } = props

  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  const handleClick = useCallback(() => onMenuOpen(!isMenuOpen), [onMenuOpen, isMenuOpen])

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (isMenuOpen && (event.key === 'Escape' || event.key === 'Tab')) {
          onMenuOpen(false)
          buttonElement?.focus()
        }
      },
      [isMenuOpen, onMenuOpen, buttonElement],
    ),
  )

  // Close menu when clicking outside of it
  // Not when clicking on the button
  useClickOutside(
    useCallback(
      (event) => {
        if (!buttonElement?.contains(event.target as Node)) {
          onMenuOpen(false)
        }
      },
      [buttonElement, onMenuOpen],
    ),
    [menuElement],
  )

  const setOptionsButtonRef = useCallback(
    (el: HTMLButtonElement | null) => {
      // Pass the button element to the parent component so that it can focus it when e.g. closing dialogs
      setMenuButtonElement(el)

      // Set focus back on the button when closing the menu
      setButtonElement(el)
    },
    [setMenuButtonElement],
  )

  // When the popover is open, focus the menu to enable keyboard navigation
  useEffect(() => {
    if (isMenuOpen) {
      menuElement?.focus()
    }
  }, [isMenuOpen, menuElement])

  return (
    <MenuActionsWrapper data-buttons space={1} padding={2}>
      <TooltipDelayGroupProvider delay={TOOLTIP_DELAY_PROPS}>
        {showEdit && (
          <Button
            aria-label="Open image edit dialog"
            data-testid="options-menu-edit-details"
            icon={CropIcon}
            mode="ghost"
            onClick={onEdit}
            ref={setHotspotButtonElement}
            tooltipProps={{content: 'Edit image'}}
          />
        )}
        {/* Using a customized Popover instead of MenuButton because a MenuButton will close on click
     and break replacing an uploaded file. */}
        <Popover
          id="image-actions-menu"
          content={<Menu ref={setMenuElement}>{children}</Menu>}
          portal
          open={isMenuOpen}
          constrainSize
        >
          <Button
            aria-label="Open image options menu"
            data-testid="options-menu-button"
            icon={EllipsisHorizontalIcon}
            mode="ghost"
            onClick={handleClick}
            ref={setOptionsButtonRef}
            tooltipProps={{content: 'Show more'}}
          />
        </Popover>
      </TooltipDelayGroupProvider>
    </MenuActionsWrapper>
  )
}
