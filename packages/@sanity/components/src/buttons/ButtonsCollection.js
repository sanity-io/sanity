/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/buttons/collection-style'

export default class ButtonsCollection extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node.isRequired,
    secondary: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf([PropTypes.node])]),
    align: PropTypes.oneOf(['start', 'end'])
  }

  static defaultProps = {
    align: 'start',
    secondary: undefined
  }

  render() {
    const {align, children, secondary} = this.props
    return (
      <div className={align === 'start' ? styles.alignStart : styles.alignEnd}>
        <div className={styles.primary}>{children}</div>
        {secondary && <div className={styles.secondary}>{secondary}</div>}
      </div>
    )
  }
}
