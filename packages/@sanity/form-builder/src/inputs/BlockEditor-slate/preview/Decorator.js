import PropTypes from 'prop-types'
import React from 'react'
import styles from '../styles/contentStyles/Decorator.css'

function Decorator(props) {
  return <span {...props.attributes} className={styles[props.mark.type]}>{props.children}</span>
}

Decorator.propTypes = {
  attributes: PropTypes.object,
  mark: PropTypes.shape({
    type: PropTypes.string
  }),
  children: PropTypes.node
}

export default Decorator
