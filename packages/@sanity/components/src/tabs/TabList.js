import PropTypes from 'prop-types'
import React from 'react'
import styles from './TabList.css'

export default function TabList(props) {
  return (
    <div className={styles.root} role="tablist">
      {props.children}
    </div>
  )
}

TabList.defaultProps = {
  children: null
}

TabList.propTypes = {
  children: PropTypes.node
}
