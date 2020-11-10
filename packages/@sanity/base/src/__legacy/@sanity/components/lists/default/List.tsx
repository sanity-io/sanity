import classNames from 'classnames'
import React, {forwardRef} from 'react'

import styles from './List.css'

const List = forwardRef(
  (props: React.HTMLProps<HTMLUListElement>, ref: React.Ref<HTMLUListElement>) => (
    <ul {...props} className={classNames(styles.root, props.className)} ref={ref} />
  )
)

List.displayName = 'List'

export default List
