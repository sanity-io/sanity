import PropTypes from 'prop-types'
import React from 'react'
import jsonMarkup from 'json-markup'

import styles from './styles/Inspector.css'

function format(value) {
  return value === undefined ? '&lt;no value&gt;' : jsonMarkup(value)
}

export default function Inspector(props) {
  return (
    <pre className={styles.root}>
      <code className={styles.code} dangerouslySetInnerHTML={{__html: format(props.inspect)}} />
    </pre>
  )
}

Inspector.propTypes = {
  inspect: PropTypes.any
}
