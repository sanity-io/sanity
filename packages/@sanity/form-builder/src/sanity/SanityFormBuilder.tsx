import {
  FormBuilderFilterFieldFn,
  MutationPatch,
  PatchEvent,
  toMutationPatches,
} from '@sanity/base/form'
import {FormFieldPresence} from '@sanity/base/presence'
import {ValidationMarker, Path, Schema, SchemaType} from '@sanity/types'
import React, {useCallback, useEffect, useRef} from 'react'
import {FormBuilderInput, FormBuilderInputInstance} from '../FormBuilderInput'
import {PatchChannel} from '../patchChannel'
import {ReviewChangesContextProvider} from './contexts/reviewChanges/ReviewChangesProvider'
import {SanityFormBuilderProvider} from './SanityFormBuilderProvider'

/**
 * @alpha
 */
export interface SanityFormBuilderProps {
  /**
   * @internal Considered internal – do not use.
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  autoFocus?: boolean
  changesOpen: boolean
  compareValue?: any | null
  filterField: FormBuilderFilterFieldFn
  focusPath: Path
  onBlur?: () => void
  onChange: (patches: MutationPatch[]) => void
  onFocus: (path: Path) => void
  presence: FormFieldPresence[]
  readOnly?: boolean
  schema: Schema
  type: SchemaType
  validation: ValidationMarker[]
  value?: any | null
}

const EMPTY = [] as never[]

/**
 * @alpha
 */
export function SanityFormBuilder(props: SanityFormBuilderProps) {
  const {
    __internal_patchChannel: patchChannel,
    autoFocus,
    changesOpen,
    compareValue,
    filterField,
    focusPath,
    onBlur,
    onChange,
    onFocus,
    presence,
    readOnly,
    schema,
    type,
    validation,
    value,
  } = props

  const inputRef = useRef<FormBuilderInputInstance | null>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleChange = useCallback(
    (patchEvent: PatchEvent) => onChange(toMutationPatches(patchEvent.patches)),
    [onChange]
  )

  const handleFocus = useCallback(
    (pathOrEvent?: Path | React.FocusEvent) => {
      onFocus(Array.isArray(pathOrEvent) ? pathOrEvent : [])
    },
    [onFocus]
  )

  return (
    <SanityFormBuilderProvider __internal_patchChannel={patchChannel} schema={schema} value={value}>
      <ReviewChangesContextProvider changesOpen={changesOpen}>
        <FormBuilderInput
          compareValue={compareValue}
          filterField={filterField}
          focusPath={focusPath}
          isRoot
          level={0}
          onBlur={onBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          path={EMPTY}
          presence={presence}
          readOnly={readOnly}
          ref={inputRef}
          type={type}
          validation={validation}
          value={value}
        />
      </ReviewChangesContextProvider>
    </SanityFormBuilderProvider>
  )
}
