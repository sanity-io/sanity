import classNames from 'classnames'
import React from 'react'

import styles from './ButtonGroup.css'

// @todo: refactor to functional component
export default class ButtonGroup extends React.PureComponent<React.HTMLProps<HTMLDivElement>> {
  render() {
    const {children, className, ...restProps} = this.props

    if (!children) {
      return null
    }

    return (
      <div {...restProps} className={classNames(styles.root, className)}>
        {children}
      </div>
    )
  }
}
