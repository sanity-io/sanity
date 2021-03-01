import classNames from 'classnames'
import React, {forwardRef} from 'react'

import styles from './GridList.css'

const GridList = forwardRef(
  (props: React.HTMLProps<HTMLUListElement>, ref: React.Ref<HTMLUListElement>) => (
    <ul {...props} className={classNames(styles.root, props.className)} ref={ref} />
  )
)

GridList.displayName = 'GridList'

export default GridList
