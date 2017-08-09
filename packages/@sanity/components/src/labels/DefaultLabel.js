import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/labels/default-style'

export default class DefaultLabel extends React.PureComponent {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    level: PropTypes.number
  }
  render() {
    const {className, level} = this.props
    const levelClass = `level_${level}`
    return (
      <div className={`${styles.root} ${className} ${styles[levelClass]}`}>
        {this.props.children}
      </div>
    )
  }
}
