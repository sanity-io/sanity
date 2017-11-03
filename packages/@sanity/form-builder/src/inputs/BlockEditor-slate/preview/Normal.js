import PropTypes from 'prop-types'
import React from 'react'
import styles from '../styles/contentStyles/Normal.css'

function Normal(props) {
  return <div {...props.attributes} className={styles.root}>{props.children}</div>
}

Normal.propTypes = {
  attributes: PropTypes.object,
  children: PropTypes.node
}

export default Normal
