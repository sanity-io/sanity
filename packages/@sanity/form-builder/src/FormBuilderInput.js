import PropTypes from 'prop-types'
import React from 'react'

const NOOP = () => {}

export class FormBuilderInput extends React.Component {
  static propTypes = {
    value: PropTypes.any,
    type: PropTypes.object.isRequired,
    validation: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    level: PropTypes.number.isRequired,
    isRoot: PropTypes.bool
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  static defaultProps = {
    onChange() {},
    validation: {messages: [], fields: {}},
    isRoot: false
  }

  resolveInputComponent(type) {
    return this.context.formBuilder.resolveInputComponent(type)
  }

  render() {
    const {onChange, value, type, level, validation, isRoot} = this.props

    const InputComponent = this.resolveInputComponent(type)
    if (!InputComponent) {
      return <div>No input resolved for type {JSON.stringify(type.name)}</div>
    }

    const docProps = InputComponent.passDocument ? {document: this.context.formBuilder.getDocument()} : {}

    return (
      <InputComponent
        value={value}
        type={type}
        onChange={type.readOnly ? NOOP : onChange}
        validation={validation}
        {...docProps}
        level={level}
        isRoot={isRoot}
      />
    )
  }
}
