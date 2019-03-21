import PropTypes from 'prop-types'
import React from 'react'

import styles from './DashboardLayout.css'

function DashboardLayout(props) {
  return <div className={styles.root}>{props.children}</div>
}

DashboardLayout.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any
}

DashboardLayout.defaultProps = {
  children: 'Dummy'
}

export default DashboardLayout
