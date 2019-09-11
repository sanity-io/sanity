import PropTypes from 'prop-types'
import React from 'react'
import GridList from '../grid/GridList'
import {createSortableList} from '../sortable-factories'

const Sortable = createSortableList(GridList)

export default function SortableGridList(props) {
  return (
    <Sortable {...props} axis="xy" distance={1} lockToContainerEdges transitionDuration={600} />
  )
}

SortableGridList.proTypes = {
  className: PropTypes.string,
  movingItemClass: PropTypes.string,
  onSortStart: PropTypes.func, // () => void,
  onSortEnd: PropTypes.func // ({oldIndex: number, newIndex: number}) => void
}
