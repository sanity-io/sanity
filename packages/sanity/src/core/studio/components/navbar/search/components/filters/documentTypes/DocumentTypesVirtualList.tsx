import {Box, Label, MenuDivider} from '@sanity/ui'
import React, {useEffect, useMemo} from 'react'
import {CommandListItems, useCommandList} from '../../../../../../../components'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {DocumentTypeMenuItem} from '../../../types'
import {DocumentTypeFilterItem} from './items/DocumentTypeFilterItem'

interface DocumentTypesVirtualListProps {
  filteredItems: DocumentTypeMenuItem[]
}

export function DocumentTypesVirtualList({filteredItems}: DocumentTypesVirtualListProps) {
  const {
    state: {
      terms: {types},
    },
  } = useSearchState()

  const {virtualizer} = useCommandList()

  useEffect(() => {
    if (types.length === 0) {
      virtualizer?.scrollToIndex(0)
    }
  }, [types.length, virtualizer])

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemFn({index}: {index: number}) {
      const virtualItem = filteredItems[index]
      if (virtualItem.type === 'divider') {
        return (
          <Box padding={1}>
            <MenuDivider />
          </Box>
        )
      }
      if (virtualItem.type === 'header') {
        return (
          <Box margin={1} paddingBottom={2} paddingTop={3} paddingX={3}>
            <Label muted size={0}>
              {virtualItem.title}
            </Label>
          </Box>
        )
      }
      if (virtualItem.type === 'item') {
        return (
          <DocumentTypeFilterItem
            paddingX={1}
            paddingTop={1}
            selected={virtualItem.selected}
            type={virtualItem.item}
          />
        )
      }
      return null
    }
  }, [filteredItems])

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
