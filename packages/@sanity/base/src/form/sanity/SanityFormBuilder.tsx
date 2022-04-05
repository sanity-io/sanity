import {ValidationMarker, Path, Schema, SchemaType} from '@sanity/types'
import React, {useCallback, useEffect, useRef} from 'react'
import {PatchEvent} from '../patch'
import {FormFieldPresence} from '../../presence'
import {FormBuilderInput, FormBuilderInputInstance} from '../FormBuilderInput'
import {PatchChannel} from '../patchChannel'
import {MutationPatch, toMutationPatches} from '../utils/mutationPatch'
import {ReviewChangesContextProvider} from './contexts/reviewChanges/ReviewChangesProvider'
import {SanityFormBuilderProvider} from './SanityFormBuilderProvider'
import {DocumentInput} from '../inputs/DocumentInput/DocumentInput'
import {FieldGroup, ObjectMember} from '../store/types'

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
  // filterField: FormBuilderFilterFieldFn
  focusPath: Path
  onBlur?: () => void
  onChange: (patches: MutationPatch[]) => void
  onFocus: (path: Path) => void
  presence: FormFieldPresence[]
  readOnly?: boolean
  members: ObjectMember[]
  groups?: FieldGroup[]
  onSelectGroup: (groupName: string) => void
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
    // filterField,
    focusPath,
    onBlur,
    onChange,
    onFocus,
    onSelectGroup,
    presence,
    readOnly,
    schema,
    type,
    validation,
    value,
    members,
    groups,
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
        <DocumentInput
          // compareValue={compareValue}
          // filterField={filterField}
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
          members={members}
          groups={groups}
          onSelectGroup={onSelectGroup}
          validation={validation}
          value={value}
        />
      </ReviewChangesContextProvider>
    </SanityFormBuilderProvider>
  )
}
