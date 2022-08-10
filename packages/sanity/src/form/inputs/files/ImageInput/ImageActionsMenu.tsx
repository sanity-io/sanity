import React, {MouseEventHandler, ReactNode, useCallback, useState} from 'react'

import {EllipsisVerticalIcon, CropIcon} from '@sanity/icons'
import {Menu, Popover, useClickOutside} from '@sanity/ui'
import {MenuActionsWrapper, ButtonContainer} from './ImageActionsMenu.styled'

interface Props {
  children: ReactNode
  onEdit: MouseEventHandler<HTMLButtonElement>
  showEdit: boolean
  isMenuOpen: boolean
  onMenuOpen: (v: boolean) => void
}

export function ImageActionsMenu(props: Props) {
  const {onEdit, children, showEdit, isMenuOpen, onMenuOpen} = props
  const [menuElement, setMenuRef] = useState<HTMLDivElement | null>(null)
  const [menuButtonRef, setMenuButtonRef] = useState<HTMLButtonElement | null>(null)

  const handleClick = React.useCallback(() => onMenuOpen(true), [onMenuOpen])

  useClickOutside(
    React.useCallback(() => onMenuOpen(false), [onMenuOpen]),
    [menuElement]
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onMenuOpen(false)
        menuButtonRef?.focus()
      }
    },
    [menuButtonRef, onMenuOpen]
  )

  return (
    <MenuActionsWrapper data-buttons space={1} padding={2}>
      {showEdit && (
        <ButtonContainer
          icon={CropIcon}
          mode="ghost"
          onClick={onEdit}
          data-testid="options-menu-edit-details"
        />
      )}
      <Popover
        content={
          <Menu ref={setMenuRef} shouldFocus="first" onKeyDown={handleKeyDown}>
            {children}
          </Menu>
        }
        portal="documentScrollElement"
        constrainSize
        open={isMenuOpen}
      >
        <ButtonContainer
          icon={EllipsisVerticalIcon}
          mode="ghost"
          data-testid="options-menu-button"
          onClick={handleClick}
          ref={setMenuButtonRef}
        />
      </Popover>
    </MenuActionsWrapper>
  )
}
