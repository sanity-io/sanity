// @flow
import React from 'react'
import CoreList from '../core/CoreList'
import {createSortableList} from '../sortable-factories'

const Sortable = createSortableList(CoreList)

export default function SortableList(props) {
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
