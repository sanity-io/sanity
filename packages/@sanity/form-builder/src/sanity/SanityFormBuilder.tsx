import React from 'react'
import {Marker, Path, Schema, SchemaType} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import {FormBuilderInput} from '../FormBuilderInput'
import SanityFormBuilderContext from './SanityFormBuilderContext'
import * as gradientPatchAdapter from './utils/gradientPatchAdapter'

type PatchChannel = {
  subscribe: () => () => {}
  receivePatches: (patches: any[]) => void
}

type Props = {
  value: any | null
  schema: Schema
  type: SchemaType
  markers: Marker[]
  patchChannel: PatchChannel
  compareValue: any
  onFocus: (path: Path) => void
  readOnly: boolean
  onChange: (patches: any[]) => void
  filterField: (field: any) => boolean
  onBlur: () => void
  autoFocus: boolean
  focusPath: Path
  presence: FormFieldPresence[]
}

const EMPTY = []

export default class SanityFormBuilder extends React.Component<Props, {}> {
  static createPatchChannel = SanityFormBuilderContext.createPatchChannel

  _input: FormBuilderInput | null

  setInput = (input: FormBuilderInput | null) => {
    this._input = input
  }

  componentDidMount() {
    const {autoFocus} = this.props
    if (this._input && autoFocus) {
      this._input.focus()
    }
  }

  handleChange = (patchEvent) => {
    this.props.onChange(gradientPatchAdapter.toGradient(patchEvent.patches))
  }

  render() {
    const {
      value,
      schema,
      patchChannel,
      type,
      readOnly,
      markers,
      onFocus,
      onBlur,
      focusPath,
      filterField,
      compareValue,
      presence,
    } = this.props
    return (
      <SanityFormBuilderContext value={value} schema={schema} patchChannel={patchChannel}>
        <FormBuilderInput
          type={type}
          onChange={this.handleChange}
          level={0}
          value={value}
          onFocus={onFocus}
          compareValue={compareValue}
          onBlur={onBlur}
          markers={markers}
          focusPath={focusPath}
          isRoot
          readOnly={readOnly}
          filterField={filterField}
          ref={this.setInput}
          path={EMPTY}
          presence={presence}
        />
      </SanityFormBuilderContext>
    )
  }
}
