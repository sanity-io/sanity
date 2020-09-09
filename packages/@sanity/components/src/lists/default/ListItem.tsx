import classNames from 'classnames'
import React, {forwardRef} from 'react'

import styles from './ListItem.css'

const ListItem = forwardRef(
  (props: React.HTMLProps<HTMLLIElement>, ref: React.Ref<HTMLLIElement>) => (
    <li {...props} className={classNames(styles.root, props.className)} ref={ref} />
  )
)

ListItem.displayName = 'ListItem'

export default ListItem
