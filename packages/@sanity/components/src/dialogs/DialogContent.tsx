import classNames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/dialogs/content-style'

export default class DialogContent extends React.PureComponent {
  static propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large', 'auto']),
    padding: PropTypes.oneOf(['none', 'small', 'medium', 'large']),
    children: PropTypes.node.isRequired
  }

  static defaultProps = {
    size: 'auto',
    padding: 'medium'
  }

  render() {
    const {size, children, padding} = this.props

    return <div className={classNames(styles[size], styles[`padding_${padding}`])}>{children}</div>
  }
}
