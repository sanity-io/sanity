import React, {PropTypes} from 'react'

import jsonMarkup from 'json-markup'

import styles from './styles/JSONView.css'

export default function JSONView(props) {
  return (
    <pre className={styles.root}>
      <code className={styles.code}
        dangerouslySetInnerHTML={{__html: jsonMarkup(props.json)}}
      />
    </pre>
  )
}

JSONView.propTypes = {
  json: PropTypes.object
}
