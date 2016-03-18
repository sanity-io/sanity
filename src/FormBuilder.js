import * as FormBuilderUtils from './FormBuilderUtils'
import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import {union} from 'lodash'
import update from 'react-addons-update'

const RenderField = React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field.isRequired,
    fieldName: PropTypes.string.isRequired,
    inputComponent: PropTypes.func,
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
    const {fieldName, inputComponent, onChange} = this.props

    const wrappedVal = inputComponent.valueContainer
      // Todo: throw if primitive value
      ? FormBuilderUtils.markWrapped(newVal, inputComponent.valueContainer)
      : newVal

    onChange(wrappedVal, fieldName)
  },

  render() {
    const {value, field, inputComponent} = this.props
    const schemaType = this.findTypeInSchema(field.fieldType)

    if (schemaType && !inputComponent) {
      return this.renderField(
        <FormBuilder
          typeName={field.fieldType}
          value={value}
          onChange={this.handleChange}
        />
      )
    }

    const wrappedVal = inputComponent.valueContainer
      ? FormBuilderUtils.maybeWrapValue(value, inputComponent.valueContainer)
      : value

    const FieldInput = inputComponent

    return this.renderField(
      <FieldInput
        value={wrappedVal}
        field={field}
        onChange={this.handleChange}
      />
    )
  }
})

// eslint-disable-next-line react/no-multi-comp
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
    const FieldInput = this.context.resolveFieldInput(field)
    console.log(fieldName, FieldInput)
    return (
      <RenderField
        key={fieldName}
        fieldName={fieldName}
        field={field}
        value={value[fieldName]}
        onChange={this.handleFieldChange}
        inputComponent={FieldInput}
      />
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
