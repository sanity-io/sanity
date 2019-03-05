import PropTypes from 'prop-types'
import React from 'react'

import styles from './DashboardGrid.css'

class DashboardGrid extends React.PureComponent {
  static propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    children: PropTypes.any
  }

  static defaultProps = {
    children: null
  }

  render() {
    const {children} = this.props
    return <div className={styles.root}>{children}</div>
  }
}

export default DashboardGrid
