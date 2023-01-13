import React, {MouseEventHandler, ReactNode, useState} from 'react'
import {EllipsisVerticalIcon, CropIcon} from '@sanity/icons'
import {Button, Inline, Menu, MenuButton, Popover, useClickOutside} from '@sanity/ui'
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

  const [menuElement, setMenuRef] = useState<HTMLDivElement | null>(null)

  const handleClick = React.useCallback(() => onMenuOpen(true), [onMenuOpen])

  useClickOutside(
    React.useCallback(() => onMenuOpen(false), [onMenuOpen]),
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

      <MenuButton
        button={
          <Popover content={<Menu ref={setMenuRef}>{children}</Menu>} portal open={isMenuOpen}>
            <Button
              aria-label="Open image options menu"
              data-testid="options-menu-button"
              icon={EllipsisVerticalIcon}
              mode="ghost"
              onClick={handleClick}
            />
          </Popover>
        }
        id="image-actions-menu"
        ref={setMenuButtonElement}
      />
    </MenuActionsWrapper>
  )
}
