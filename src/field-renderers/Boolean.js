import styles from './styles/Boolean.css'
import React, {PropTypes} from 'react'
import Field from '../Field.js'

// Field renderer for boolean fields
export default function BooleanFieldRenderer(props) {
  const {input, field} = props
  return (
    <Field>
      <div>This is the title</div>
      <label>
        {input} {field.title}
      </label>
    </Field>
  )
}

BooleanFieldRenderer.propTypes = {
  input: PropTypes.node,
  fieldName: PropTypes.string,
  field: PropTypes.shape({
    title: PropTypes.string
  })
}
