import classNames from 'classnames'
import React, {forwardRef} from 'react'

import styles from './GridItem.css'

const GridItem = forwardRef((props: React.HTMLProps<HTMLLIElement>, ref) => {
  const {children, className, ...restProps} = props

  return (
    <li {...restProps} className={classNames(styles.root, className)} ref={ref as any}>
      {children}
    </li>
  )
})

GridItem.displayName = 'GridItem'

export default GridItem
