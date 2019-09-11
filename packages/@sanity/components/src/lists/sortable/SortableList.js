import PropTypes from 'prop-types'
import React from 'react'
import List from '../default/List'
import {createSortableList} from '../sortable-factories'

const Sortable = createSortableList(List)

export default function SortableList(props) {
  return <Sortable {...props} lockToContainerEdges axis="y" lockAxis="y" />
}

SortableList.propTypes = {
  className: PropTypes.string,
  movingItemClass: PropTypes.string,
  onSortStart: PropTypes.func, // () => void,
  onSortEnd: PropTypes.func // ({oldIndex: number, newIndex: number}) => void
}
