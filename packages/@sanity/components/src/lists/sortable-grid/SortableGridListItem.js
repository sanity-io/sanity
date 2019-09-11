import React from 'react'
import {createSortableItem} from '../sortable-factories'
import cx from 'classnames'
import GridItem from '../grid/GridItem'
import styles from './styles/SortableGridItem.css'

const SortableItem = createSortableItem(GridItem)

export default function SortableGridItem(props) {
  // eslint-disable-next-line react/prop-types
  const {className, ...rest} = props
  return <SortableItem {...rest} className={cx(styles.root, className)} />
}
