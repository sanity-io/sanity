// @flow
import React from 'react'
import SanityFormBuilderContext from './SanityFormBuilderContext'
import {FormBuilderInput} from '../FormBuilderInput'
import SimpleFocusManager from './focusManagers/SimpleFocusManager'

type PatchChannel = {
  subscribe: () => () => {},
  receivePatches: (patches: Array<*>) => void
}

type Props = {
  value: ?any,
  schema: any,
  type: Object,
  patchChannel: PatchChannel,
  onChange: () => {},
  autoFocus: boolean
}

export default class SanityFormBuilder extends React.Component<Props> {
  _input: ?FormBuilderInput

  setInput = (input: ?FormBuilderInput) => {
    this._input = input
  }

  componentDidMount() {
    const {autoFocus} = this.props
    if (this._input && autoFocus) {
      this._input.focus()
    }
  }

  renderInput = ({onFocus, onBlur, focusPath}) => {
    const {value, type, onChange} = this.props
    return (
      <FormBuilderInput
        type={type}
        onChange={onChange}
        level={0}
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        focusPath={focusPath}
        isRoot
        ref={this.setInput}
      />
    )
  }

  render() {
    const {value, schema, patchChannel} = this.props
    return (
      <SanityFormBuilderContext
        value={value}
        schema={schema}
        patchChannel={patchChannel}
      >
        <SimpleFocusManager>{this.renderInput}</SimpleFocusManager>
      </SanityFormBuilderContext>
    )
  }
}

SanityFormBuilder.createPatchChannel = SanityFormBuilderContext.createPatchChannel
