import React, {JSXElementConstructor, MouseEventHandler, ReactElement} from 'react'

import {EllipsisVerticalIcon, EditIcon} from '@sanity/icons'
import {MenuButton} from '@sanity/ui'
import {MenuActionsWrapper, ButtonContainer} from './ImageActionsMenu.styled'

interface Props {
  children: ReactElement<any, string | JSXElementConstructor<any>>
  onEdit: MouseEventHandler<HTMLButtonElement>
}

export function ImageActionsMenu(props: Props) {
  const {onEdit, children} = props

  return (
    <MenuActionsWrapper data-buttons space={1} padding={2}>
      <ButtonContainer icon={EditIcon} mode="ghost" onClick={onEdit} />
      <MenuButton
        button={<ButtonContainer icon={EllipsisVerticalIcon} mode="ghost" />}
        id="menu-button-example"
        menu={children}
        popover={{portal: true}}
      />
    </MenuActionsWrapper>
  )
}
