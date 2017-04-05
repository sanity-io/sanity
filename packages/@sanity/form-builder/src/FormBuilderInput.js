import React, {PropTypes} from 'react'

export class FormBuilderInput extends React.Component {
  static propTypes = {
    value: PropTypes.any,
    type: PropTypes.object.isRequired,
    validation: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    level: PropTypes.number.isRequired
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  static defaultProps = {
    onChange() {},
    validation: {messages: [], fields: {}}
  }

  resolveInputComponent(type) {
    return this.context.formBuilder.resolveInputComponent(type)
  }

  render() {
    const {onChange, value, type, level, validation} = this.props

    const InputComponent = this.resolveInputComponent(type)
    if (!InputComponent) {
      return <div>No input resolved for type {JSON.stringify(type.name)}</div>
    }

    const passValue = value && value.constructor.passSerialized ? value.serialize() : value
    const docProps = InputComponent.passDocument ? {document: this.context.formBuilder.getDocument()} : {}

    return (
      <InputComponent
        value={passValue}
        type={type}
        onChange={onChange}
        validation={validation}
        {...docProps}
        level={level}
      />
    )
  }
}
