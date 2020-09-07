import classNames from 'classnames'
import React from 'react'

import styles from '../styles/DefaultList.css'

const DefaultList = React.forwardRef(
  (props: React.HTMLProps<HTMLUListElement>, ref: React.Ref<HTMLUListElement>) => {
    return <ul {...props} className={classNames(styles.root, props.className)} ref={ref} />
  }
)

DefaultList.displayName = 'DefaultList'

export default DefaultList
