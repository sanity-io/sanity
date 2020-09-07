/* eslint-disable react/prop-types */

import classNames from 'classnames'
import React from 'react'

import styles from './List.css'

const List = React.forwardRef(
  (props: React.HTMLProps<HTMLUListElement>, ref: React.Ref<HTMLUListElement>) => {
    return <ul {...props} className={classNames(styles.root, props.className)} ref={ref} />
  }
)

List.displayName = 'List'

export default List
