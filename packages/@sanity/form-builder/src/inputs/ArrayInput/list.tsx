import {Card, Grid} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {MOVING_ITEM_CLASS_NAME, sortableGrid, sortableItem, sortableList} from './sortable'

const ListItem = styled(Card)`
  &.${MOVING_ITEM_CLASS_NAME} {
    z-index: 10000;
    box-shadow: 0 0 0 1px var(--card-shadow-outline-color),
      0 8px 17px 2px var(--card-shadow-umbra-color),
      0 3px 14px 2px var(--card-shadow-penumbra-color),
      0 5px 5px -3px var(--card-shadow-ambient-color);
  }
`
const GridItem = ListItem

const SortableList = sortableList(Grid)
const SortableListItem = sortableItem(ListItem)

const SortableGrid = sortableGrid(Grid)
const SortableGridItem = SortableListItem

type ListProps = {
  isSortable: boolean
  isGrid: boolean
  onSortEnd: (event: {newIndex: number; oldIndex: number}) => void
  children?: React.ReactNode
}

export function List(props: ListProps) {
  const {isSortable, isGrid, onSortEnd, ...rest} = props

  if (isGrid) {
    return isSortable ? (
      <SortableGrid columns={[2, 3, 4]} gap={2} onSortEnd={onSortEnd} {...rest} />
    ) : (
      <Grid columns={[2, 3, 4]} gap={2} {...rest} />
    )
  }

  return isSortable ? <SortableList onSortEnd={onSortEnd} {...rest} /> : <Grid {...rest} />
}

type ItemProps = {isSortable: boolean; isGrid: boolean; children?: React.ReactNode; index: number}

export function Item(props: ItemProps) {
  const {isSortable, isGrid, ...rest} = props
  if (isGrid) {
    const ItemComponent = isSortable ? SortableGridItem : GridItem
    return <ItemComponent {...rest} />
  }
  const ItemComponent = isSortable ? SortableListItem : ListItem
  return <ItemComponent {...rest} marginY={1} />
}
