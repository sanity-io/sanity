import React, {MouseEventHandler, ReactNode, useCallback, useState} from 'react'
import {EllipsisVerticalIcon, CropIcon} from '@sanity/icons'
import {Button, Inline, Menu, Popover, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import styled from 'styled-components'

export const MenuActionsWrapper = styled(Inline)`
  position: absolute;
  top: 0;
  right: 0;
`

interface ImageActionsMenuProps {
  children: ReactNode
  onEdit: MouseEventHandler<HTMLButtonElement>
  setHotspotButtonElement: (element: HTMLButtonElement | null) => void
  showEdit: boolean
  isMenuOpen: boolean
  onMenuOpen: (flag: boolean) => void
}

export function ImageActionsMenu(props: ImageActionsMenuProps) {
  const {onEdit, children, showEdit, setHotspotButtonElement, onMenuOpen, isMenuOpen} = props

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
      [isMenuOpen, onMenuOpen, buttonElement]
    )
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
      [buttonElement, onMenuOpen]
    ),
    [menuElement]
  )

  return (
    <MenuActionsWrapper data-buttons space={1} padding={2}>
      {showEdit && (
        <Button
          aria-label="Open image edit dialog"
          data-testid="options-menu-edit-details"
          icon={CropIcon}
          mode="ghost"
          onClick={onEdit}
          ref={setHotspotButtonElement}
        />
      )}

      <Popover
        id="image-actions-menu"
        content={
          <Menu ref={setMenuElement} shouldFocus="first">
            {children}
          </Menu>
        }
        portal
        open={isMenuOpen}
        constrainSize
      >
        <Button
          aria-label="Open image options menu"
          data-testid="options-menu-button"
          icon={EllipsisVerticalIcon}
          mode="ghost"
          onClick={handleClick}
          ref={setButtonElement}
        />
      </Popover>
    </MenuActionsWrapper>
  )
}
