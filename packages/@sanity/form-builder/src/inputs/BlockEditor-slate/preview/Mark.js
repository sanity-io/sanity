import PropTypes from 'prop-types'
import React from 'react'
import styles from '../styles/contentStyles/Mark.css'

function Mark(props) {
  return <span {...props.attributes} className={styles[props.mark.type]}>{props.children}</span>
}

Mark.propTypes = {
  attributes: PropTypes.object,
  mark: PropTypes.shape({
    type: PropTypes.string
  }),
  children: PropTypes.node
}

export default Mark
