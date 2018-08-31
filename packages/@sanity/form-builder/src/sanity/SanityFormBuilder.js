// @flow
import React from 'react'
import SanityFormBuilderContext from './SanityFormBuilderContext'
import {FormBuilderInput} from '../FormBuilderInput'
import {Marker} from '../typedefs'

type PatchChannel = {
  subscribe: () => () => {},
  receivePatches: (patches: Array<*>) => void
}

type Props = {
  value: ?any,
  schema: any,
  type: Object,
  markers: Array<Marker>,
  patchChannel: PatchChannel,
  onFocus: Path => void,
  readOnly: boolean,
  onChange: () => {},
  filterField: (field: any) => boolean,
  onBlur: () => void,
  autoFocus: boolean,
  focusPath: Path
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

  render() {
    const {
      value,
      schema,
      patchChannel,
      type,
      onChange,
      readOnly,
      markers,
      onFocus,
      onBlur,
      focusPath,
      filterField
    } = this.props

    return (
      <SanityFormBuilderContext
        value={value}
        schema={schema}
        patchChannel={patchChannel}
      >
        <FormBuilderInput
          type={type}
          onChange={onChange}
          level={0}
          value={value}
          onFocus={onFocus}
          onBlur={onBlur}
          markers={markers}
          focusPath={focusPath}
          isRoot
          readOnly={readOnly}
          filterField={filterField}
          ref={this.setInput}
        />
      </SanityFormBuilderContext>
    )
  }
}

SanityFormBuilder.createPatchChannel = SanityFormBuilderContext.createPatchChannel
