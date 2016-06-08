import equals from 'shallow-equals'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import {getFieldType} from '../../utils/getFieldType'
import React, {PropTypes} from 'react'

export default class RenderField extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    fieldName: PropTypes.string.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func
  };

  static contextTypes = {
    resolveFieldComponent: PropTypes.func,
    resolveInputComponent: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  };

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
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
    const {value, field, fieldName} = this.props

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

    const passValue = value && value.constructor.passUnwrapped ? value.unwrap() : value

    const input = (
      <FieldInput
        value={passValue}
        field={field}
        type={fieldType}
        onChange={this.handleChange}
      />
    )

    return <FieldComponent input={input} field={field} fieldName={fieldName} type={fieldType} />
  }
}
