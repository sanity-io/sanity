import React from 'react'
import PropTypes from 'prop-types'
import styles from './TitleStyle.css'

const TitleStyle = props => {
  return <div className={styles.root}>{props.children}</div>
}

TitleStyle.propTypes = {
  children: PropTypes.node.isRequired
}

export default TitleStyle
