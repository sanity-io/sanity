// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import classNames from 'classnames'
import DragHandleIcon from 'part:@sanity/base/drag-handle-icon'
import React, {forwardRef} from 'react'
import {createDragHandle} from '../sortable/sortable-factories'

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
