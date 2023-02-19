import React, {useMemo} from 'react'
import {CommandListItems} from '../../../../../../../components'
import type {FilterMenuItem} from '../../../types'
import {getFilterKey} from '../../../utils/filterUtils'
import {MenuItemFilter} from './items/MenuItemFilter'
import {MenuItemHeader} from './items/MenuItemHeader'

interface AddFilterVirtualListProps {
  menuItems: FilterMenuItem[]
  onClose: () => void
}

export function AddFilterVirtualList({menuItems, onClose}: AddFilterVirtualListProps) {
  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({index}: {index: number}) {
      const menuItem = menuItems[index]
      if (menuItem.type === 'filter') {
        return <MenuItemFilter item={menuItem} onClose={onClose} paddingTop={1} paddingX={1} />
      }
      if (menuItem.type === 'header') {
        return <MenuItemHeader item={menuItem} />
      }
      return null
    }
  }, [menuItems, onClose])

  return (
    <CommandListItems
      item={VirtualListItem}
      paddingBottom={1}
      virtualizerOptions={{
        estimateSize: () => 45,
        getItemKey: (index) => {
          const menuItem = menuItems[index]
          switch (menuItem.type) {
            case 'filter':
              return [
                ...(menuItem.group ? [menuItem.group] : []), //
                getFilterKey(menuItem.filter),
              ].join('-')
            case 'header':
              return `${menuItem.type}-${menuItem.title}`
            default:
              return index
          }
        },
        overscan: 20,
      }}
    />
  )
}
