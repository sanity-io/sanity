import React from 'react'
import GridList from '../grid/GridList'
import {createSortableList} from '../sortable-factories'

const Sortable = createSortableList(GridList)

interface SortableGridListProps {
  className?: string
  children?: React.ReactNode
  movingItemClass?: string
  onSort?: (params: {oldIndex: number; newIndex: number}) => void
  onSortStart?: () => void
  onSortEnd?: (params: {oldIndex: number; newIndex: number}) => void
}

export default function SortableGridList(props: SortableGridListProps) {
  return (
    <Sortable {...props} axis="xy" distance={1} lockToContainerEdges transitionDuration={600} />
  )
}
