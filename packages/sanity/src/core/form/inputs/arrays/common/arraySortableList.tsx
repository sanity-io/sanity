import {Card, Grid, Theme} from '@sanity/ui'
import React, {ComponentProps, useCallback} from 'react'
import styled from 'styled-components'
import {MOVING_ITEM_CLASS_NAME, sortableItem, sortableList} from './sortable'

const ListItem = styled(Card)`
  &.${MOVING_ITEM_CLASS_NAME} {
    z-index: 10000;
    border-radius: ${({theme}) => theme.sanity.radius[2]}px;
    box-shadow: 0 0 0 0, 0 8px 17px 2px var(--card-shadow-umbra-color),
      0 3px 14px 2px var(--card-shadow-penumbra-color),
      0 5px 5px -3px var(--card-shadow-ambient-color);

    // Used inside CellItem
    [data-ui='DragHandleCard'] {
      opacity: 1;
    }

    [data-ui='DragHandleButton'] {
      background-color: ${({theme}: {theme: Theme}) =>
        theme.sanity.color.button.bleed.primary.pressed.bg};
      color: ${({theme}: {theme: Theme}) => theme.sanity.color.button.bleed.primary.pressed.fg};
      [data-ui='Text'] {
        color: inherit;
      }
    }
  }
`

const SortableList = sortableList(Grid)
const SortableListItem = sortableItem(ListItem)

interface ListProps extends ComponentProps<typeof Grid> {
  sortable?: boolean
  lockAxis?: 'x' | 'y' | 'xy'
  axis?: 'x' | 'y' | 'xy'
  onItemMove?: (event: {fromIndex: number; toIndex: number}) => void
  children?: React.ReactNode
  tabIndex?: number
}

export function ArraySortableList(props: ListProps) {
  const {onItemMove, sortable, ...rest} = props

  // Note: this is here to make SortableList API compatible with onItemMove
  const handleSortEnd = useCallback(
    (event: {newIndex: number; oldIndex: number}) =>
      onItemMove?.({
        fromIndex: event.oldIndex,
        toIndex: event.newIndex,
      }),
    [onItemMove]
  )

  return sortable ? <SortableList onSortEnd={handleSortEnd} {...rest} /> : <Grid {...rest} />
}

type ItemProps = {sortable?: boolean; children?: React.ReactNode; index: number}

export function ArraySortableItem(props: ItemProps & ComponentProps<typeof Card>) {
  const {sortable, ...rest} = props
  return sortable ? <SortableListItem {...rest} /> : <ListItem {...rest} />
}
