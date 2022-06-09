import {Card, Grid, Theme} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {MOVING_ITEM_CLASS_NAME, sortableGrid, sortableItem, sortableList} from './sortable'

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
const GridItem = ListItem

const SortableList = sortableList(Grid)
const SortableListItem = sortableItem(ListItem)

const SortableGrid = sortableGrid(Grid)
const SortableGridItem = SortableListItem

type ListProps = {
  isSortable?: boolean
  isGrid?: boolean
  onSortEnd?: (event: {newIndex: number; oldIndex: number}) => void
  children?: React.ReactNode
}

export function List(props: ListProps) {
  const {isSortable, isGrid, onSortEnd, ...rest} = props

  if (isGrid) {
    return isSortable ? (
      <SortableGrid columns={[2, 3, 4]} gap={3} onSortEnd={onSortEnd} {...rest} />
    ) : (
      <Grid columns={[2, 3, 4]} gap={3} {...rest} />
    )
  }

  return isSortable ? (
    <SortableList gap={1} onSortEnd={onSortEnd} {...rest} />
  ) : (
    <Grid gap={1} {...rest} />
  )
}

type ItemProps = {isSortable?: boolean; isGrid?: boolean; children?: React.ReactNode; index: number}

export function Item(props: ItemProps) {
  const {isSortable, isGrid, ...rest} = props
  if (isGrid) {
    const ItemComponent = isSortable ? SortableGridItem : GridItem
    return <ItemComponent {...rest} />
  }
  const ItemComponent = isSortable ? SortableListItem : ListItem
  return <ItemComponent {...rest} />
}
