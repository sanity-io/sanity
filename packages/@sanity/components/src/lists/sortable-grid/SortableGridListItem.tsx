import React from 'react'
import cx from 'classnames'
import {createSortableItem} from '../sortable-factories'
import GridItem from '../grid/GridItem'

import styles from './styles/SortableGridItem.css'

const SortableItem = createSortableItem(GridItem)

interface SortableGridItemProps {
  className?: string
  children?: React.ReactNode
  index: number
}

export default function SortableGridItem(props: SortableGridItemProps) {
  const {className, ...rest} = props

  return <SortableItem {...rest} className={cx(styles.root, className)} />
}
