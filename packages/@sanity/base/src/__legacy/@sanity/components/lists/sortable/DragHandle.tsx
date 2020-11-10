import classNames from 'classnames'
import DragHandleIcon from 'part:@sanity/base/drag-handle-icon'
import React, {forwardRef} from 'react'
import {createDragHandle} from './sortable-factories'

import styles from './DragHandle.css'

const DragHandle = forwardRef(
  (props: React.HTMLProps<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) => (
    <div {...props} className={classNames(styles.root, props.className)} ref={ref}>
      <DragHandleIcon />
    </div>
  )
)

DragHandle.displayName = 'DragHandle'

export default createDragHandle(DragHandle)
