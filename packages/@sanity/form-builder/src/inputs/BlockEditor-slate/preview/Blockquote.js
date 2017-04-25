import PropTypes from 'prop-types'
import React from 'react'
import styles from '../styles/contentStyles/Blockquote.css'

function Blockquote(props) {
  return (
    <div className={styles.root}>
      <blockquote {...props.attributes} className={styles.quote}>{props.children}</blockquote>
    </div>
  )
}

Blockquote.propTypes = {
  attributes: PropTypes.object,
  children: PropTypes.node
}

export default Blockquote
