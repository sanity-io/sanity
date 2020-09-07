import DragBarsIcon from 'part:@sanity/base/bars-icon'
import React from 'react'
import {createDragHandle} from '../sortable-factories'

const DragHandle = (props: {className?: string}) => (
  <span className={props.className}>
    <DragBarsIcon />
  </span>
)

export default createDragHandle(DragHandle)
