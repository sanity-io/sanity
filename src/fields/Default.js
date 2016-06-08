import styles from './styles/Default.css'

import React, {PropTypes} from 'react'
import Field from '../Field.js'

export default function DefaultField(props) {
  const {input, field} = props
  return (
    <Field label={field.title}>
      <div className={styles.root}>
        <div className={styles.formControl}>
          {input}
        </div>
      </div>
    </Field>
  )
}

DefaultField.propTypes = {
  input: PropTypes.node,
  fieldName: PropTypes.string,
  field: PropTypes.shape({
    title: PropTypes.string
  })
}
