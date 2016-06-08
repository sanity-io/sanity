import styles from './styles/Default.css'

import React, {PropTypes} from 'react'
import Field from '../Field.js'

export default function ObjectFieldRenderer(props) {
  const {input, field} = props
  return (
    <fieldset className={styles.root}>
      <legend>{field.title}</legend>
      <div className={styles.formControl}>
        {input}
      </div>
    </fieldset>
  )
}

ObjectFieldRenderer.propTypes = {
  input: PropTypes.node,
  fieldName: PropTypes.string,
  field: PropTypes.shape({
    title: PropTypes.string
  })
}
