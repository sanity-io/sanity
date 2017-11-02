// @flow
import React from 'react'
import type {Path} from './typedefs/path'
import PatchEvent from './PatchEvent'
import type {Type} from '../../schema/src/sanity/typedefs'

const NOOP = () => {}

function hasFocus(path) {
  return path.length === 1 && path[0] === true
}

function setFocus(input) {
  if (!input) {
    console.log('Missing input. Check your refs.')
    return
  }
  if (typeof input.focus === 'function') {
    input.focus()
  } else {
    console.warn('Input component %o has no focus method. Please implement', input)
  }
}

type Props = {
  value: any,
  type: Type,
  onChange: PatchEvent => void,
  onFocus: Path => void,
  onBlur: () => void,
  focusPath: Path,
  level: number,
  isRoot: boolean,
}

export const FormBuilderInput = class FormBuilderInput extends React.Component<Props> {

  static contextTypes = {
    formBuilder: () => {}
  };

  static defaultProps = {
    level: 0,
    isRoot: false,
    focusPath: []
  }

  _input: ?FormBuilderInput

  componentDidMount() {
    const {focusPath} = this.props
    if (hasFocus(focusPath)) {
      setFocus(this._input)
    }
  }
  componentDidUpdate() {
    const {focusPath} = this.props
    if (hasFocus(focusPath)) {
      setFocus(this._input)
    }
  }
  resolveInputComponent(type: Type) {
    return this.context.formBuilder.resolveInputComponent(type)
  }

  setInput = (component: ?FormBuilderInput) => {
    this._input = component
  }

  focus() {
    this._input.focus()
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
