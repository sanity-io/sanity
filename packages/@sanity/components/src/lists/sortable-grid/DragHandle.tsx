import React from 'react'
import DragBarsIcon from 'part:@sanity/base/bars-icon'
import {createDragHandle} from '../sortable-factories'

import styles from './styles/DragHandle.css'

export default createDragHandle(() => (
  <span className={styles.dragHandle}>
    <DragBarsIcon />
  </span>
))
