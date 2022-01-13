import React, {JSXElementConstructor, MouseEventHandler, ReactElement} from 'react'

import {EllipsisVerticalIcon, EditIcon} from '@sanity/icons'
import {Menu, MenuButton} from '@sanity/ui'
import {MenuActionsWrapper, ButtonContainer} from './ImageActionsMenu.styled'

interface Props {
  children: ReactElement<any, string | JSXElementConstructor<any>>
  onEdit: MouseEventHandler<HTMLButtonElement>
  showEdit: boolean
}

export function ImageActionsMenu(props: Props) {
  const {onEdit, children, showEdit} = props

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
      <MenuButton
        button={
          <ButtonContainer
            icon={EllipsisVerticalIcon}
            mode="ghost"
            data-testid="options-menu-button"
          />
        }
        id="menu-button-example"
        menu={<Menu>{children}</Menu>}
        popover={{portal: true}}
      />
    </MenuActionsWrapper>
  )
}
