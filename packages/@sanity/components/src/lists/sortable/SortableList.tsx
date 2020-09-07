import React from 'react'
import List from '../default/List'
import {createSortableList} from '../sortable-factories'

const Sortable = createSortableList(List)

interface SortableListProps {
  // className: string
  children?: React.ReactNode
  // movingItemClass: string
  onSort?: (params: {oldIndex: number; newIndex: number}) => void
  // onSortStart: () => void
  // onSortEnd: (params: {oldIndex: number; newIndex: number}) => void
}

export default function SortableList(props: SortableListProps) {
  return <Sortable {...props} lockToContainerEdges axis="y" lockAxis="y" />
}
