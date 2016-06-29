import React, {PropTypes} from 'react'
import DefaultFieldWrapper from './DefaultFieldWrapper'

// Field component for boolean fields
export default function BooleanField(props) {
  const {input, field} = props
  return (
    <DefaultFieldWrapper {...props}>
      <label>
        {input} {field.title}
      </label>
    </DefaultFieldWrapper>
  )
}

BooleanField.propTypes = {
  input: PropTypes.node,
  fieldName: PropTypes.string,
  field: PropTypes.shape({
    title: PropTypes.string
  })
}
