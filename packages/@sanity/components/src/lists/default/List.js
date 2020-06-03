import React from 'react'
import styles from '../styles/DefaultList.css'
import classNames from 'classnames'

const DefaultList = React.forwardRef((props, ref) => {
  return <ul {...props} className={classNames([styles.root, props.className])} ref={ref} />
})

DefaultList.displayName = 'DefaultList'

export default DefaultList
