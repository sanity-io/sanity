import styles from '../styles/form-builder.css'
import React, {PropTypes} from 'react'

export default function DefaultFieldRenderer(props) {
  const {input, field} = props
  return (
    <div className={styles.field}>
      <label className={styles.fieldTitle}>
        {field.title}
      </label>
      <div className={styles.formControlContainer}>
        {input}
      </div>
    </div>
  )
}

DefaultFieldRenderer.propTypes = {
  input: PropTypes.node,
  fieldName: PropTypes.string,
  field: PropTypes.shape({
    title: PropTypes.string
  })
}
