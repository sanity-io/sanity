// @flow
import React from 'react'
import DragBarsIcon from 'part:@sanity/base/bars-icon'
import {createDragHandle} from '../sortable-factories'

export default createDragHandle(props => (
  <span className={props.className}>
    <DragBarsIcon />
  </span>
))
