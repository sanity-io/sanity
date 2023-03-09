import React, {cloneElement} from 'react'
import styled from 'styled-components'
import {useCommandList} from './context'
import {ItemContext} from './types'

const ListItem = styled.div`
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
`

interface CommandListItemsProps {
  renderItem: (item: any, context: ItemContext) => React.ReactNode
}

export function CommandListItems(props: CommandListItemsProps) {
  const {renderItem} = props
  const {ScrollElement, virtualItems, items, commandListId} = useCommandList() || {}

  return (
    <ScrollElement>
      {virtualItems.map((virtualItem) => {
        const id = `${commandListId}-item-${items.indexOf(virtualItem.item)}`
        const itemToRender = renderItem(virtualItem.item, virtualItem.context) as React.ReactElement

        const clonedItem = cloneElement(itemToRender, {
          'aria-selected': virtualItem.context.active ? 'true' : 'false',
          'data-index': virtualItem.context.index,
          tabIndex: -1,
        })

        return (
          <ListItem
            key={virtualItem.context.key}
            aria-posinset={virtualItem.context.index + 1}
            aria-setsize={items.length}
            role="listitem"
            id={id}
            style={{
              transform: `translateY(${virtualItem.context.start}px)`,
              height: `${virtualItem.context.size}px`,
            }}
          >
            {clonedItem}
          </ListItem>
        )
      })}
    </ScrollElement>
  )
}
