import React, {MouseEventHandler, ReactNode, useState} from 'react'

import {EllipsisVerticalIcon, EditIcon} from '@sanity/icons'
import {Menu, Popover, useClickOutside} from '@sanity/ui'
import {MenuActionsWrapper, ButtonContainer} from './ImageActionsMenu.styled'

interface Props {
  children: ReactNode
  onEdit: MouseEventHandler<HTMLButtonElement>
  showEdit: boolean
}

export function ImageActionsMenu(props: Props) {
  const {onEdit, children, showEdit} = props
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [menuElement, setMenuRef] = useState<HTMLDivElement | null>(null)

  const handleClick = React.useCallback(() => setMenuOpen(!isMenuOpen), [setMenuOpen, isMenuOpen])

  useClickOutside(
    React.useCallback(() => setMenuOpen(false), [setMenuOpen]),
    [menuElement]
  )

  return (
    <MenuActionsWrapper data-buttons space={1} padding={2}>
      {showEdit && (
        <ButtonContainer
          icon={EditIcon}
          mode="ghost"
          onClick={onEdit}
          data-testid="options-menu-edit-details"
        />
      )}
      <Popover content={<Menu ref={setMenuRef}>{children}</Menu>} portal open={isMenuOpen}>
        <ButtonContainer
          icon={EllipsisVerticalIcon}
          mode="ghost"
          data-testid="options-menu-button"
          onClick={handleClick}
        />
      </Popover>
    </MenuActionsWrapper>
  )
}
