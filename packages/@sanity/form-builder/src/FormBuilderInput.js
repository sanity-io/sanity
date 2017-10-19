import PropTypes from 'prop-types'
import React from 'react'

const NOOP = () => {}

export class FormBuilderInput extends React.Component {
  static propTypes = {
    value: PropTypes.any,
    type: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    level: PropTypes.number.isRequired,
    isRoot: PropTypes.bool
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  static defaultProps = {
    isRoot: false
  }

  resolveInputComponent(type) {
    return this.context.formBuilder.resolveInputComponent(type)
  }

  render() {
    const {onChange, value, type, level, isRoot, ...rest} = this.props

    const InputComponent = this.resolveInputComponent(type)
    if (!InputComponent) {
      return <div>No input resolved for type {JSON.stringify(type.name)}</div>
    }

    const rootProps = isRoot ? {isRoot} : {}

    return (
      <InputComponent
        {...rest}
        value={value}
        type={type}
        onChange={type.readOnly ? NOOP : onChange}
        level={level}
        {...rootProps}
      />
    )
  }
}
