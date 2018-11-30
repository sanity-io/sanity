/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/ButtonGroup.css'

export default class ButtonGroup extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node.isRequired
  }

  render() {
    const {children} = this.props

    if (!children) {
      return null
    }

    return <div className={styles.root}>{children}</div>
  }
}
