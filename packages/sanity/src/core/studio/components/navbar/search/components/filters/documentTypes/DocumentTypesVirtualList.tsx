import {Box, Label, MenuDivider} from '@sanity/ui'
import React, {useEffect, useMemo} from 'react'
import {
  CommandListItems,
  CommandListVirtualItemProps,
  useCommandList,
} from '../../../../../../../components'
import type {DocumentTypeMenuItem} from '../../../types'
import {DocumentTypeFilterItem} from './items/DocumentTypeFilterItem'

interface DocumentTypesVirtualListProps {
  filteredItems: DocumentTypeMenuItem[]
}

export function DocumentTypesVirtualList({filteredItems}: DocumentTypesVirtualListProps) {
  const {values, virtualizer} = useCommandList()

  useEffect(() => {
    if (values.length === 0) {
      virtualizer?.scrollToIndex(0)
    }
  }, [values.length, virtualizer])

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({
      value,
    }: CommandListVirtualItemProps<DocumentTypeMenuItem>) {
      if (value.type === 'divider') {
        return (
          <Box padding={1}>
            <MenuDivider />
          </Box>
        )
      }
      if (value.type === 'header') {
        return (
          <Box margin={1} paddingBottom={2} paddingTop={3} paddingX={3}>
            <Label muted size={0}>
              {value.title}
            </Label>
          </Box>
        )
      }
      if (value.type === 'item') {
        return (
          <DocumentTypeFilterItem
            paddingX={1}
            paddingTop={1}
            selected={value.selected}
            type={value.item}
          />
        )
      }
      return null
    }
  }, [])

  return (
    <CommandListItems
      item={VirtualListItem}
      paddingBottom={1}
      virtualizerOptions={{
        estimateSize: () => 37,
        getItemKey: (index) => {
          const virtualItem = filteredItems[index]
          switch (virtualItem.type) {
            case 'divider':
              return `${virtualItem.type}-${index}`
            case 'header':
              return `${virtualItem.type}-${virtualItem.title}`
            case 'item':
              return `${virtualItem.type}-${virtualItem.item.name}`
            default:
              return index
          }
        },
        overscan: 20,
      }}
    />
  )
}
