import classNames from 'classnames'
import DragHandleIcon from 'part:@sanity/base/drag-handle-icon'
import React, {forwardRef} from 'react'
import {createDragHandle} from '../sortable/sortable-factories'

import styles from './DragHandle.css'

const DragHandle = forwardRef(
  ({className, ...restProps}: React.HTMLProps<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) => (
    <div {...restProps} className={classNames(styles.root, className)} ref={ref}>
      <DragHandleIcon />
    </div>
  )
)

DragHandle.displayName = 'DragHandle'

export default createDragHandle(DragHandle)
