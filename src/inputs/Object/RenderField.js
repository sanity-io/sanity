import equals from 'shallow-equals'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import {getFieldType} from '../../utils/getFieldType'
import React, {PropTypes} from 'react'

// This component renders a single field in an object type. It emits onChange events telling the owner about the name of the field
// that changed. This gives the owner an opportunity to use the same event handler function for all of its fields
export default class RenderField extends React.Component {

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    fieldName: PropTypes.string.isRequired,
    validation: PropTypes.shape(FormBuilderPropTypes.validation),
    value: PropTypes.any,
    onChange: PropTypes.func,
    level: PropTypes.number
  };

  static defaultProps = {
    validation: {messages: [], fields: {}}
  };

  static contextTypes = {
    resolveFieldComponent: PropTypes.func,
    resolveInputComponent: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  };

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  handleChange(event) {
    const {fieldName, onChange} = this.props
    onChange(event, fieldName)
  }

  resolveInputComponent(field, fieldType) {
    return this.context.resolveInputComponent(field, fieldType)
  }

  resolveFieldComponent(field, fieldType) {
    return this.context.resolveFieldComponent(field, fieldType)
  }

  getFieldType(field) {
    return getFieldType(this.context.schema, field)
  }

  render() {
    const {value, field, fieldName, level, validation} = this.props

    const fieldType = this.getFieldType(field)

    const FieldInput = this.context.resolveInputComponent(field, fieldType)

    if (!FieldInput) {
      return (
        <div>Field input not found for field of type "{field.type}"
          <pre>{JSON.stringify(field, null, 2)}</pre>
        </div>
      )
    }

    const FieldComponent = this.resolveFieldComponent(field, fieldType)

    const passValue = value && value.constructor.passSerialized ? value.serialize() : value
    const input = (
      <FieldInput
        level={level + 1}
        value={passValue}
        field={field}
        type={fieldType}
        validation={validation}
        onChange={this.handleChange}
      />
    )

    return (
      <FieldComponent
        level={level}
        input={input}
        field={field}
        fieldName={fieldName}
        validation={validation}
        type={fieldType}
      />
    )
  }
}
