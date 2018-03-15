// @flow
import React from 'react'
import DragBarsIcon from 'part:@sanity/base/bars-icon'
import styles from './styles/DragHandle.css'
import {createDragHandle} from '../sortable-factories'

export default createDragHandle(() => (
  <span className={styles.dragHandle}>
    <DragBarsIcon />
  </span>
))
