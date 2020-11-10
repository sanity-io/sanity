import classNames from 'classnames'
import React, {forwardRef} from 'react'

import styles from './GridItem.css'

const GridItem = forwardRef(
  (props: React.HTMLProps<HTMLLIElement>, ref: React.Ref<HTMLLIElement>) => (
    <li {...props} className={classNames(styles.root, props.className)} ref={ref} />
  )
)

GridItem.displayName = 'GridItem'

export default GridItem
