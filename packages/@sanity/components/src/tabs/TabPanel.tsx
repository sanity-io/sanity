import PropTypes from 'prop-types'
import React from 'react'

import styles from './TabPanel.css'

export default function TabPanel(props) {
  const className = [styles.root, props.className].filter(Boolean).join(' ')
  return (
    <div
      aria-labelledby={props['aria-labelledby']}
      className={className}
      id={props.id}
      role="tabpanel"
      tabIndex={props.tabIndex === undefined ? 0 : props.tabIndex}
    >
      {props.children}
    </div>
  )
}

TabPanel.propTypes = {
  'aria-labelledby': PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  id: PropTypes.string.isRequired,
  tabIndex: PropTypes.number
}

TabPanel.defaultProps = {
  children: null,
  className: undefined,
  tabIndex: undefined
}
