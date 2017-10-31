import PropTypes from 'prop-types'
import React from 'react'
import withValuePath from './utils/withValuePath'

const NOOP = () => {}

function hasFocus(path) {
  return path.length === 1 && path[0] === true
}
function syncFocus(input, path) {
  if (!input) {
    console.log('Missing input. Check your refs.')
    return
  }
  if (hasFocus(path)) {
    if (typeof input.focus === 'function') {
      input.focus()
    } else {
      console.warn('Input component has no focus method. Please implement')
    }
  }
}

export const FormBuilderInput = class FormBuilderInput extends React.Component {
  static propTypes = {
    value: PropTypes.any,
    type: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    focusPath: PropTypes.array,
    level: PropTypes.number.isRequired,
    isRoot: PropTypes.bool,
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  static defaultProps = {
    isRoot: false,
    focusPath: []
  }

  componentDidMount() {
    syncFocus(this._input, this.props.focusPath)
  }

  resolveInputComponent(type) {
    return this.context.formBuilder.resolveInputComponent(type)
  }

  setInput = component => {
    this._input = component
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
        ref={this.setInput}
      />
    )
  }
}
