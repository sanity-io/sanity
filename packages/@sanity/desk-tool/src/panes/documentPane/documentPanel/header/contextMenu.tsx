import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import Button from 'part:@sanity/components/buttons/default'
import Menu from 'part:@sanity/components/menus/default'
import React, {useMemo} from 'react'
import {Tooltip} from 'react-tippy'
import {MenuAction, MenuItemGroup} from '../../types'

import styles from './contextMenu.css'

interface DocumentPanelContextMenuProps {
  isCollapsed: boolean
  isOpen: boolean
  items: MenuAction[]
  itemGroups: MenuItemGroup[]
  onAction: (action: MenuAction) => void
  onCloseMenu: () => void
  onToggleMenu: () => void
}

export function DocumentPanelContextMenu(props: DocumentPanelContextMenuProps) {
  const {isCollapsed, isOpen, items, itemGroups, onAction, onCloseMenu, onToggleMenu} = props

  const id = useMemo(
    () =>
      Math.random()
        .toString(36)
        .substr(2, 6),
    []
  )

  return (
    <Tooltip
      arrow
      distance={13}
      theme="light"
      trigger="click"
      position="bottom"
      interactive
      open={isOpen}
      onRequestClose={onCloseMenu}
      useContext
      html={
        <Menu
          id={id}
          items={items}
          groups={itemGroups}
          origin={isCollapsed ? 'top-left' : 'top-right'}
          onAction={onAction}
          onClose={onCloseMenu}
          onClickOutside={onCloseMenu}
        />
      }
    >
      <Button
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={id}
        className={styles.menuOverflowButton}
        icon={IconMoreVert}
        kind="simple"
        onClick={onToggleMenu}
        padding="small"
        selected={isOpen}
        title="Show menu"
      />
    </Tooltip>
  )
}
