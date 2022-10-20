import React, {MouseEventHandler, ReactNode} from 'react'
import {EllipsisVerticalIcon, CropIcon} from '@sanity/icons'
import {Button, Inline, Menu, MenuButton, MenuButtonProps} from '@sanity/ui'
import styled from 'styled-components'

const POPOVER_PROPS: MenuButtonProps['popover'] = {portal: true, constrainSize: true}

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
}

export function ImageActionsMenu(props: ImageActionsMenuProps) {
  const {onEdit, children, showEdit, setHotspotButtonElement, setMenuButtonElement} = props

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
          <Button
            aria-label="Open image options menu"
            data-testid="options-menu-button"
            icon={EllipsisVerticalIcon}
            mode="ghost"
          />
        }
        id="image-actions-menu"
        menu={<Menu>{children}</Menu>}
        popover={POPOVER_PROPS}
        ref={setMenuButtonElement}
      />
    </MenuActionsWrapper>
  )
}
