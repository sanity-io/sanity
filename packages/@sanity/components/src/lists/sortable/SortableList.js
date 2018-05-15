// @flow
import React from 'react'
import List from '../default/List'
import {createSortableList} from '../sortable-factories'

const Sortable = createSortableList(List)

type Props = {
  className: string,
  movingItemClass: string,
  onSortStart: () => void,
  onSortEnd: ({oldIndex: number, newIndex: number}) => void
}

export default function SortableList(props: Props) {
  return <Sortable {...props} lockToContainerEdges axis="y" lockAxis="y" />
}
