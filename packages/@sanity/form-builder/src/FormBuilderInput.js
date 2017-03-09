import React, {PropTypes} from 'react'

export class FormBuilderInput extends React.Component {
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

  resolveInputComponent(type) {
    return this.context.formBuilder.resolveInputComponent(type)
  }

  resolvePreviewComponent(type) {
    return this.context.formBuilder.resolvePreviewComponent(type)
  }

  render() {
    const {onChange, value, validation} = this.props

    const type = value.context.type

    const InputComponent = this.resolveInputComponent(type)
    if (!InputComponent) {
      return <div>No input resolved for type {JSON.stringify(type.name)}</div>
    }

    const passSerialized = value && value.constructor.passSerialized

    return (
      <InputComponent
        type={type}
        onChange={onChange}
        validation={validation}
        value={passSerialized ? value.serialize() : value}
        isRoot
      />
    )
  }
}
