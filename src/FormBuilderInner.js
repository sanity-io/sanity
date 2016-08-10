import React, {PropTypes} from 'react'
import {getFieldType} from './utils/getFieldType'

export class FormBuilderInner extends React.Component {
  static propTypes = {
    value: PropTypes.any,
    validation: PropTypes.object,
    onChange: PropTypes.func
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  static defaultProps = {
    onChange() {},
    validation: {messages: [], fields: {}}
  }

  resolveInputComponent(field, type) {
    return this.context.formBuilder.resolveInputComponent(field, type)
  }

  render() {
    const {onChange, value, validation} = this.props

    const field = value.context.field
    const schemaType = getFieldType(this.context.formBuilder.schema, field)

    const FieldInput = this.resolveInputComponent(field, schemaType)
    if (!FieldInput) {
      return <div>No field input resolved for field {JSON.stringify(field)}</div>
    }

    const passSerialized = value && value.constructor.passSerialized

    return (
      <FieldInput
        field={field}
        type={schemaType}
        onChange={onChange}
        validation={validation}
        value={passSerialized ? value.serialize() : value}
        focus
      />
    )
  }
}
