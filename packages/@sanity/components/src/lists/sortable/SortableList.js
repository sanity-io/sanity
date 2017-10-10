// @flow
import React from 'react'
import List from '../default/List'
import {createSortableList} from '../sortable-factories'

const Sortable = createSortableList(List)

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
