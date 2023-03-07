import React, {useMemo} from 'react'
import {CommandListItems, CommandListVirtualItemProps} from '../../../../../../../components'
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
    return function VirtualListItemComponent({value}: CommandListVirtualItemProps<FilterMenuItem>) {
      if (value.type === 'filter') {
        return <MenuItemFilter item={value} onClose={onClose} paddingTop={1} paddingX={1} />
      }
      if (value.type === 'header') {
        return <MenuItemHeader item={value} />
      }
      return null
    }
  }, [onClose])

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
