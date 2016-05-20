import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import equals from 'shallow-equals'
import basicTypes from './types'
import {resolveJSType} from './types/utils'

const BASIC_TYPE_NAMES = Object.keys(basicTypes)
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
    const fieldType = this.context.schema.types[field.type]
    if (fieldType) {
      return fieldType
    }
    if (!BASIC_TYPE_NAMES.includes(field.type)) {
      // todo: this will normally fail during schema compilation, but keep it here for now and consider remove later
      const {index} = this.props
      console.warn('Invalid field type of field "%s". Must be one of %s', index, BASIC_TYPE_NAMES.join(', '))
    }
    // Treat as "anonymous"/inline type where type parameters are defined in field
    // todo: consider validate that the needed params are defined in field (currently also taken
    // care of during schema compilation)
    return field
  },

  render() {
    const {value, field, index} = this.props

    const fieldType = this.getFieldType(field)

    // // wont check wrapped field values since unwrapping may be costly
    // if (value) {
    //
    //   const basicType = basicTypes[fieldType.type]
    //
    //   const valueType = resolveJSType(value)
    //
    //   if (valueType !== fieldType.type && valueType !== basicType.primitive) {
    //     // eslint-disable-next-line no-console
    //     console.warn(
    //       'Value of field %s is of type %s which is incompatible with the basic type %s',
    //       index,
    //       fieldType.type,
    //       valueType
    //     )
    //   }
    // }

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
