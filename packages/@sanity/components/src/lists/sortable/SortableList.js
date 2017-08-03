// @flow
import React from 'react'
import CoreList from '../core/CoreList'
import {createSortableList} from '../sortable-factories'

const Sortable = createSortableList(CoreList)

type Props = {
  className: string,
  movingItemClass: string,
  onSort: ({oldIndex: number, newIndex: number}) => void
}

export default function SortableList(props: Props) {
  return (
    <Sortable
      {...props}
      distance={1}
      lockToContainerEdges
      axis="y"
      lockAxis="y"
    />
  )
}
