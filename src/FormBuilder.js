import React, {PropTypes} from 'react'
import update from 'react-addons-update'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import * as FormBuilderUtils from './FormBuilderUtils'

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

  handleFieldChange(newVal, propName) {
    this.props.onChange(update(this.props.value || {}, {
      [propName]: {$set: newVal}
    }))
  },

  render() {
    const {value = {}, typeName} = this.props

    const type = this.findTypeInSchema(typeName)

    const {fields} = type
    return (
      <div>
        {Object.keys(fields).map(fieldName => {
          const field = fields[fieldName]
          const renderField = el => (
            <fieldset key={fieldName}>
              <h1>{field.title} ({fieldName})</h1>
              {el}
            </fieldset>
          )

          const handleFieldChange = newVal => this.handleFieldChange(newVal, fieldName)

          const FieldBuilder = this.context.resolveFieldInput(field)

          const schemaType = this.findTypeInSchema(field.type)

          if (schemaType && !FieldBuilder) {
            return renderField(<FormBuilder typeName={field.type} value={value[fieldName]} onChange={handleFieldChange} />)
          }

          const wrappedVal = FieldBuilder.valueContainer
            ? FormBuilderUtils.maybeWrapValue(value[fieldName], FieldBuilder.valueContainer)
            : value[fieldName]

          const wrappedOnChange = FieldBuilder.valueContainer
            // Todo: validate against primitive values
            ? newVal => handleFieldChange(FormBuilderUtils.markWrapped(newVal, FieldBuilder.valueContainer))
            : handleFieldChange

          return renderField(
            <FieldBuilder
              value={wrappedVal}
              field={field}
              onChange={wrappedOnChange}
            />
          )
        })}
      </div>
    )
  }
})

export default FormBuilder
