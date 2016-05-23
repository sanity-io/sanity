import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from './utils/getFieldType'

const CLEAR_BUTTON_STYLES = {fontSize: 10, border: '1px solid #aaa', backgroundColor: 'transparent'}

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
          style={CLEAR_BUTTON_STYLES}
          type="button"
          title="delete"
          onClick={() => this.handleChange()}
        >
          -
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

    return this.renderField(
      <FieldInput
        value={value}
        field={field}
        type={fieldType}
        onChange={this.handleChange}
      />
    )
  }
})
