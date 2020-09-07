import cx from 'classnames'
import React from 'react'

import styles from './styles/GridList.css'

interface GridListProps {
  onSortEnd?: () => void
  onSortStart?: () => void
  lockToContainerEdges?: boolean
  useDragHandle?: boolean
}

export default function GridList(props: GridListProps & React.HTMLProps<HTMLUListElement>) {
  // @todo: why are these unused props here?
  const {className, onSortEnd, onSortStart, lockToContainerEdges, useDragHandle, ...rest} = props

  return <ul {...rest} className={cx(styles.root, className)} />
}
