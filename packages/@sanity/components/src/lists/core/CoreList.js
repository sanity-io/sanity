// @flow
import React from 'react'
import styles from './styles/CoreList.css'
import cx from 'classnames'

export default class List extends React.Component<*> {
  props: {
    className: string
  }

  render() {
    const {
      className,
      ...rest
    } = this.props

    return (
      <ul {...rest} className={cx(styles.root, className)} />
    )
  }
}
