import React from 'react'
import {ValidationMarker, Path, Schema, SchemaType} from '@sanity/types'
import {MutationPatch, toMutationPatches} from '@sanity/base/_internal'
import {FormFieldPresence} from '@sanity/base/presence'
import {FormBuilderInput, FormBuilderInputInstance} from '../FormBuilderInput'
import {FormBuilderFilterFieldFn} from '../types'
import {PatchChannel} from '../patchChannel'
import PatchEvent from '../PatchEvent'
import {SanityFormBuilderProvider} from './SanityFormBuilderProvider'
import {ReviewChangesContextProvider} from './contexts/reviewChanges/ReviewChangesProvider'

/**
 * @alpha
 */
export interface SanityFormBuilderProps {
  /**
   * @internal Considered internal – do not use.
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  value: any | null
  schema: Schema
  type: SchemaType
  validation: ValidationMarker[]
  compareValue: any
  onFocus: (path: Path) => void
  readOnly: boolean
  onChange: (patches: MutationPatch[]) => void
  filterField: FormBuilderFilterFieldFn
  onBlur: () => void
  autoFocus?: boolean
  focusPath: Path
  presence: FormFieldPresence[]
  changesOpen: boolean
  resolveInputComponent?: (type: SchemaType) => React.ComponentType<any> | null | undefined
}

const EMPTY = []

/**
 * @alpha
 */
export class SanityFormBuilder extends React.Component<SanityFormBuilderProps> {
  _input: FormBuilderInputInstance | null

  setInput = (input: FormBuilderInputInstance | null) => {
    this._input = input
  }

  componentDidMount() {
    const {autoFocus} = this.props
    if (this._input && autoFocus) {
      this._input.focus()
    }
  }

  handleChange = (patchEvent: PatchEvent) => {
    this.props.onChange(toMutationPatches(patchEvent.patches))
  }

  render() {
    const {
      value,
      schema,
      __internal_patchChannel: patchChannel,
      type,
      readOnly,
      validation,
      onFocus,
      onBlur,
      focusPath,
      filterField,
      compareValue,
      presence,
      changesOpen,
      resolveInputComponent,
    } = this.props
    return (
      <SanityFormBuilderProvider
        __internal_patchChannel={patchChannel}
        value={value}
        schema={schema}
        resolveInputComponent={resolveInputComponent}
      >
        <ReviewChangesContextProvider changesOpen={changesOpen}>
          <FormBuilderInput
            type={type}
            onChange={this.handleChange}
            level={0}
            value={value}
            onFocus={onFocus}
            compareValue={compareValue}
            onBlur={onBlur}
            validation={validation}
            focusPath={focusPath}
            isRoot
            readOnly={readOnly}
            filterField={filterField}
            ref={this.setInput}
            path={EMPTY}
            presence={presence}
          />
        </ReviewChangesContextProvider>
      </SanityFormBuilderProvider>
    )
  }
}
