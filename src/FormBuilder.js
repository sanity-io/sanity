import React, {PropTypes} from 'react'
import update from 'react-addons-update'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import * as FormBuilderUtils from './FormBuilderUtils'
import {union} from 'lodash'

const RenderField = React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field.isRequired,
    fieldName: PropTypes.string.isRequired,
    builder: PropTypes.func,
    value: PropTypes.any,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveFieldInput: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  },

  shouldComponentUpdate(nextProps) {
    const changed = union(Object.keys(this.props), Object.keys(nextProps)).find(propName => {
      return this.props[propName] !== nextProps[propName]
    })
    console.log('changed field: ', changed, Boolean(changed))
    return Boolean(changed)
  },

  findTypeInSchema(typeName) {
    return this.context.schema[typeName]
  },

  renderField(el) {
    const {field, fieldName} = this.props
    return (
      <fieldset key={fieldName}>
        <h1>{field.title} ({fieldName})</h1>
        {el}
      </fieldset>
    )
  },
  handleChange(newVal) {
    const {fieldName, builder, onChange} = this.props

    const wrappedVal = (builder && builder.valueContainer)
      // Todo: throw if primitive value
      ? FormBuilderUtils.markWrapped(newVal, builder.valueContainer)
      : newVal

    onChange(wrappedVal, fieldName)
  },

  render() {
    const {value, field, builder} = this.props
    const schemaType = this.findTypeInSchema(field.type)

    if (schemaType && !builder) {
      return this.renderField(
        <FormBuilder
          typeName={field.type}
          value={value}
          onChange={this.handleChange}
        />
      )
    }

    const wrappedVal = builder.valueContainer
      ? FormBuilderUtils.maybeWrapValue(value, builder.valueContainer)
      : value


    const FieldBuilder = builder
    return this.renderField(
      <FieldBuilder
        value={wrappedVal}
        field={field}
        onChange={this.handleChange}
      />
    )
  }
})

const FormBuilder = React.createClass({
  propTypes: {
    typeName: PropTypes.string.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveFieldInput: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  },

  getDefaultProps() {
    return {
      value: {},
      onChange() {}
    }
  },

  findTypeInSchema(typeName) {
    return this.context.schema[typeName]
  },

  handleFieldChange(newVal, fieldName) {
    this.props.onChange(update(this.props.value || {}, {
      [fieldName]: {$set: newVal}
    }))
  },

  renderField(fieldName, field) {
    const {value = {}} = this.props
    const FieldBuilder = this.context.resolveFieldInput(field)
    return (
      <RenderField
        key={fieldName}
        fieldName={fieldName}
        field={field}
        value={value[fieldName]}
        onChange={this.handleFieldChange}
        builder={FieldBuilder} />
    )
  },

  render() {
    const {typeName} = this.props

    const type = this.findTypeInSchema(typeName)

    const {fields} = type
    return (
      <div>
        {Object.keys(fields).map(fieldName => {
          const field = fields[fieldName]
          return this.renderField(fieldName, field)
        })}
      </div>
    )
  }
})

export default FormBuilder
