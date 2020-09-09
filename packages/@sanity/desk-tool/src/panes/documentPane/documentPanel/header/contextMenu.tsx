import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import {MenuButton} from 'part:@sanity/components/menu-button'
import Menu, {MenuItemType, MenuItemGroupType} from 'part:@sanity/components/menus/default'
import React, {useCallback, useMemo} from 'react'

import styles from './contextMenu.css'

interface DocumentPanelContextMenuProps {
  isCollapsed: boolean
  items: MenuItemType[]
  itemGroups: MenuItemGroupType[]
  onAction: (action: MenuItemType) => void
  open: boolean
  setOpen: (val: boolean) => void
}

export function DocumentPanelContextMenu(props: DocumentPanelContextMenuProps) {
  const {isCollapsed, open, items, itemGroups, onAction, setOpen} = props

  const id = useMemo(
    () =>
      Math.random()
        .toString(36)
        .substr(2, 6),
    []
  )

  const handleAction = useCallback(
    (action: MenuItemType) => {
      onAction(action)
      setOpen(false)
    },
    [onAction, setOpen]
  )

  const handleCloseMenu = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  return (
    <MenuButton
      buttonProps={{
        'aria-label': 'Menu',
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': id,
        className: styles.menuOverflowButton,
        icon: IconMoreVert,
        kind: 'simple',
        padding: 'small',
        selected: open,
        title: 'Show menu'
      }}
      menu={
        <Menu
          id={id}
          items={items}
          groups={itemGroups}
          onAction={handleAction}
          onClose={handleCloseMenu}
        />
      }
      open={open}
      placement="bottom"
      setOpen={setOpen}
    />
  )
}
