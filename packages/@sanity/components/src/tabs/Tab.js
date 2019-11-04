import PropTypes from 'prop-types'
import React from 'react'

import styles from './Tab.css'

export default function Tab(props) {
  const {id, isActive, label, onClick} = props

  return (
    <button
      aria-controls={props['aria-controls']}
      aria-selected={isActive ? 'true' : 'false'}
      className={isActive ? styles.isActive : styles.root}
      id={id}
      onClick={onClick}
      role="tab"
      tabIndex={isActive ? 0 : -1}
      type="button"
    >
      {label}
    </button>
  )
}

Tab.propTypes = {
  'aria-controls': PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  label: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired
}

Tab.defaultProps = {
  isActive: false
}
