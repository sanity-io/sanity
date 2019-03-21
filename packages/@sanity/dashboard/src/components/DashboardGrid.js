import PropTypes from 'prop-types'
import React from 'react'

import styles from './DashboardGrid.css'

function DashboardGrid(props) {
  return <div className={styles.root}>{props.children}</div>
}

DashboardGrid.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any
}

DashboardGrid.defaultProps = {
  children: null
}

export default DashboardGrid
