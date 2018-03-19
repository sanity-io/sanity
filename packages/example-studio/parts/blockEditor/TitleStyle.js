import React from 'react'
import PropTypes from 'prop-types'
import styles from './TitleStyle.css'

const TitleStyle = props => {
  return <span className={styles.root}>{props.children}</span>
}

TitleStyle.propTypes = {
  children: PropTypes.node.isRequired
}

export default TitleStyle
