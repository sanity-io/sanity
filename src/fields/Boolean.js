import styles from './styles/Boolean.css'
import React, {PropTypes} from 'react'
import Field from '../Field.js'

// Field component for boolean fields
export default function BooleanField(props) {
  const {input, field} = props
  return (
    <Field>
      <label>
        {input} {field.title}
      </label>
    </Field>
  )
}

BooleanField.propTypes = {
  input: PropTypes.node,
  fieldName: PropTypes.string,
  field: PropTypes.shape({
    title: PropTypes.string
  })
}
