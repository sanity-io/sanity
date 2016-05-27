import styles from '../styles/form-builder.css'
import React, {PropTypes} from 'react'

// Field renderer for boolean fields
export default function DefaultFieldRenderer(props) {
  const {input, field} = props
  return (
    <div className={styles.field}>
      <label className={styles.fieldTitle}>
        {input} {field.title}
      </label>
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
