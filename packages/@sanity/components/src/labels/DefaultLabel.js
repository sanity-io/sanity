import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/labels/default-style'

export default class DefaultLabel extends React.PureComponent {
  static propTypes = {
    htmlFor: PropTypes.string.isRequired,
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    level: PropTypes.number
  }
  render() {
    const {htmlFor, className, level} = this.props
    const levelClass = `level_${level}`
    return (
      <label htmlFor={htmlFor} className={`${styles.root} ${className} ${styles[levelClass]}`}>
        {this.props.children}
      </label>
    )
  }
}
