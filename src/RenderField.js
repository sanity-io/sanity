import equals from 'shallow-equals'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import {getFieldType} from './utils/getFieldType'
import React, {PropTypes} from 'react'
// import {resolveJSType} from './types/utils'
import DefaultFieldRenderer from './field-renderers/Default'

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field.isRequired,
    fieldName: PropTypes.string.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveFieldRenderer: PropTypes.func,
    resolveFieldInput: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  },

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
  },

  handleChange(event) {
    const {fieldName, onChange} = this.props
    onChange(event, fieldName)
  },

  resolveFieldInput(field, fieldType) {
    return this.context.resolveFieldInput(field, fieldType)
  },

  resolveFieldRenderer(field, fieldType) {
    return this.context.resolveFieldRenderer(field, fieldType) || DefaultFieldRenderer
  },

  getFieldType(field) {
    return getFieldType(this.context.schema, field)
  },

  render() {
    const {value, field, fieldName} = this.props

    const fieldType = this.getFieldType(field)

    const FieldInput = this.context.resolveFieldInput(field, fieldType)

    if (!FieldInput) {
      return (
        <div>Field input not found for field of type "{field.type}"
          <pre>{JSON.stringify(field, null, 2)}</pre>
        </div>
      )
    }


    const FieldRenderer = this.resolveFieldRenderer(field, fieldType)

    const passValue = value && value.constructor.passUnwrapped ? value.unwrap() : value

    const input = (
      <FieldInput
        value={passValue}
        field={field}
        type={fieldType}
        onChange={this.handleChange}
      />
    )

    return <FieldRenderer input={input} field={field} fieldName={fieldName} type={fieldType} />
  }
})
