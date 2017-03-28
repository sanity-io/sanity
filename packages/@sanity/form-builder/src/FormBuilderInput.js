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

  resolvePreviewComponent(type) {
    return this.context.formBuilder.resolvePreviewComponent(type)
  }

  render() {
    const {onChange, value, type, level, validation} = this.props

    const InputComponent = this.resolveInputComponent(type)
    if (!InputComponent) {
      return <div>No input resolved for type {JSON.stringify(type.name)}</div>
    }

    const passValue = value && value.constructor.passSerialized ? value.serialize() : value
    const document = InputComponent.passDocument ? this.context.formBuilder.getDocument() : null

    return (
      <InputComponent
        value={passValue}
        type={type}
        onChange={onChange}
        validation={validation}
        document={document}
        level={level}
      />
    )
  }
}
