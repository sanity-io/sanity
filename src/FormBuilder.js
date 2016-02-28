import React, {PropTypes} from 'react'
import inspect from 'object-inspect'
//import inspect from 'object-inspect'
//import cx from 'classnames'
import {omit, assign} from 'lodash'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import Field from './Field'
import update from 'react-addons-update'

const FormBuilder = React.createClass({
  propTypes: {
    fields: PropTypes.objectOf(FormBuilderPropTypes.field),
    value: PropTypes.any,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveFieldInput: PropTypes.func,
    resolveFieldRenderer: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  },

  resolveFieldRenderer(field) {
    if (field.isPrimitive) {
      return props => props.children
    }
    return this.context.resolveFieldRenderer(field)
  },

  handleFieldChange(newVal, fieldName) {
    this.props.onChange(update(this.props.value || {}, {
      [fieldName]: {$set: newVal}
    }))
  },

  renderFields(fields) {
    return Object.keys(fields).map(fieldName => {
      const field = fields[fieldName]
      const value = (this.props.value || {})[fieldName]
      const FieldBuilder = this.context.resolveFieldInput(field)

      return (
        <fieldset key={fieldName}>
          <h1>{field.title} ({fieldName})</h1>
          <Field
            value={value}
            field={field}
            builder={FieldBuilder}
            name={fieldName}
            onChange={this.handleFieldChange}
          />
        </fieldset>
      )
    })
  },

  render() {
    const {fields} = this.props
    return (
      <div>{this.renderFields(fields)}</div>
    )
  }
})

export default FormBuilder
