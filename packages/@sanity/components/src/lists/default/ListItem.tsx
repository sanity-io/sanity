import classNames from 'classnames'
import React, {forwardRef} from 'react'

import styles from './ListItem.css'

const ListItem = forwardRef(
  (props: React.HTMLProps<HTMLLIElement>, ref: React.Ref<HTMLLIElement>) => {
    const {children, className, ...restProps} = props

    return (
      <li {...restProps} className={classNames(styles.root, className)} ref={ref}>
        {children}
      </li>
    )
  }
)

ListItem.displayName = 'ListItem'

export default ListItem
