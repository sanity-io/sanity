import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import {getFieldType} from '../../schema/getFieldType'
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
    onEnter: PropTypes.func,
    level: PropTypes.number,
    focus: PropTypes.bool
  };

  static defaultProps = {
    validation: {messages: [], fields: {}},
    onEnter() {
    }
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
    this.handleEnter = this.handleEnter.bind(this)
  }

  handleChange(event) {
    const {fieldName, onChange} = this.props
    onChange(event, fieldName)
  }

  handleEnter(event) {
    const {fieldName, onEnter} = this.props
    onEnter(event, fieldName)
  }

  resolveInputComponent(field, fieldType) {
    return this.context.formBuilder.resolveInputComponent(field, fieldType)
  }

  getFieldType(field) {
    return getFieldType(this.context.formBuilder.schema, field)
  }

  render() {
    const {value, field, fieldName, level, validation, focus} = this.props

    const fieldType = this.getFieldType(field)

    const FieldInput = this.context.formBuilder.resolveInputComponent(field, fieldType)

    if (!FieldInput) {
      return (
        <div>Field input not found for field of type "{field.type}"
          <pre>{JSON.stringify(field, null, 2)}</pre>
        </div>
      )
    }

    const passValue = value && value.constructor.passSerialized ? value.serialize() : value

    const docProps = FieldInput.passDocument ? {document: this.context.formBuilder.getDocument()} : {}

    return (
      <FieldInput
        fieldName={fieldName}
        level={level}
        value={passValue}
        field={field}
        type={fieldType}
        validation={validation}
        onChange={this.handleChange}
        onEnter={this.handleEnter}
        focus={focus}
        {...docProps}
      />
    )
  }
}
