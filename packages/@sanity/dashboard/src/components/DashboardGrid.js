import React from 'react'
import styles from './DashboardGrid.css'

class DashboardGrid extends React.PureComponent {
  render() {
    const {children} = this.props
    return <div className={styles.root}>{children}</div>
  }
}

export default DashboardGrid
