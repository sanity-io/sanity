// @flow
import React from 'react'
import GridList from '../grid/GridList'
import {createSortableList} from '../sortable-factories'

const Sortable = createSortableList(GridList)

type Props = {
  className: string,
  movingItemClass: string,
  onSortStart: () => void,
  onSortEnd: ({oldIndex: number, newIndex: number}) => void
}

export default function SortableGridList(props: Props) {
  return (
    <Sortable {...props} axis="xy" distance={1} lockToContainerEdges transitionDuration={600} />
  )
}
