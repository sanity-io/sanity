import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from './utils/getFieldType'

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field.isRequired,
    index: PropTypes.number.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveFieldInput: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  },

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
  },

  renderField(el) {
    const {index} = this.props
    return (
      <div key={index}>
        <button
          type="button"
          title="delete"
          onClick={() => this.handleChange()}
        >
          - Remove
        </button>
        {el}
      </div>
    )
  },

  handleChange(event) {
    const {index, onChange} = this.props
    onChange(event, index)
  },

  resolveFieldInput(field, fieldType) {
    return this.context.resolveFieldInput(field, fieldType)
  },

  getFieldType(field) {
    return getFieldType(this.context.schema, field)
  },

  render() {
    const {value, field} = this.props

    const fieldType = this.getFieldType(field)

    const FieldInput = this.context.resolveFieldInput(field, fieldType)
    if (!FieldInput) {
      return (
        <div>Field input not found for field of type "{field.type}"
          <pre>{JSON.stringify(field, null, 2)}</pre>
        </div>
      )
    }

    const passUnwrapped = value.constructor.passUnwrapped

    return this.renderField(
      <FieldInput
        value={passUnwrapped ? value.unwrap() : value}
        field={field}
        type={fieldType}
        onChange={this.handleChange}
      />
    )
  }
})
