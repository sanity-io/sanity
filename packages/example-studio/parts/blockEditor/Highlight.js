import React from 'react'
import PropTypes from 'prop-types'
import styles from './Highlight.css'

const Highlight = props => {
  return <span className={styles.root}>{props.children}</span>
}

Highlight.propTypes = {
  children: PropTypes.node.isRequired
}

export default Highlight
