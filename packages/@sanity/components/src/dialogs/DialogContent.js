/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/dialogs/content-style'

export default class DialogContent extends React.PureComponent {
  static propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large', 'auto']),
    padding: PropTypes.oneOf(['medium']),
    children: PropTypes.node.isRequired
  }

  static defaultProps = {
    size: 'auto',
    padding: undefined
  }
  render() {
    const {size, children, padding} = this.props
    return <div className={`${styles[size]} ${padding ? styles.padding : ''}`}>{children}</div>
  }
}
