import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import RenderField from '../RenderField'
import update from 'react-addons-update'
import basicTypes from '../types/basic'
import {resolveJSType} from '../types/utils'
import {isWrapped} from '../FormBuilderUtils'

const BASIC_TYPE_NAMES = Object.keys(basicTypes)

export default React.createClass({
  propTypes: {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.object,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveFieldInput: PropTypes.func,
    schema: PropTypes.object
  },

  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  handleFieldChange(newVal, fieldName) {
    const {type} = this.props
    this.props.onChange(update(this.props.value || {$type: type.name}, {
      [fieldName]: {$set: newVal}
    }))
  },

  renderField(fieldName, field) {
    const {value = {}} = this.props
    let type = this.context.schema[field.type]
    if (!type) {
      if (!BASIC_TYPE_NAMES.includes(field.type)) {
        // todo: this will normally fail during schema compilation, but keep it here for now and consider remove later
        console.warn('Invalid field type of field "%s". Must be one of %s', fieldName, BASIC_TYPE_NAMES.join(', '))
      }
      // Treat as "anonymous"/inline type where type parameters are defined in field
      // todo: consider validate that the needed params are defined in field (currently also taken
      // care of during schema compilation)
      type = field
    }


    const fieldValue = value[fieldName]

    // wont check wrapped field values since unwrapping may be costly
    if (fieldValue && !isWrapped(fieldValue)) {
      const basicType = resolveJSType(fieldValue)
      if (basicType !== type.type) {
        // eslint-disable-next-line no-console
        console.warn(
          'Value of field %s is of type %s which is incompatible with the basic type %s',
          fieldName,
          type.type,
          basicType
        )
      }
    }

    const FieldInput = this.context.resolveFieldInput(field, type)
    if (!FieldInput) {
      return (
        <div>Field input not found for field of type "{field.type}"
          <pre>{JSON.stringify(field, null, 2)}</pre>
        </div>
      )
    }
    return (
      <RenderField
        key={fieldName}
        fieldName={fieldName}
        field={field}
        type={type}
        value={fieldValue}
        onChange={this.handleFieldChange}
        fieldInput={FieldInput}
      />
    )
  },

  render() {
    const {type} = this.props
    return (
      <div>
        {Object.keys(type.fields).map(fieldName => {
          return this.renderField(fieldName, type.fields[fieldName])
        })}
      </div>
    )
  }
})
