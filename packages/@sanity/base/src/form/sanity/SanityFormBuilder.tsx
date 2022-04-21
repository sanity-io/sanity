import {ObjectSchemaType, Path, Schema, SchemaType, ValidationMarker} from '@sanity/types'
import React, {useCallback, useEffect, useRef} from 'react'
import {PatchEvent} from '../patch'
import {FormFieldPresence} from '../../presence'
import {FormBuilderInputInstance} from '../FormBuilderInput'
import {PatchChannel} from '../patchChannel'
import {MutationPatch, toMutationPatches} from '../utils/mutationPatch'
import {DocumentInput} from '../inputs/DocumentInput/DocumentInput'
import {FieldGroup, ObjectMember, RenderFieldCallbackArg} from '../store/types'
import {useSource} from '../../studio'
import {FormInputProps} from '../types'
import {fallbackInputs} from '../fallbackInputs'
import {SanityFormBuilderProvider} from './SanityFormBuilderProvider'
import {resolveInputComponent as defaultInputResolver} from './inputResolver/inputResolver'

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
  onSetCollapsed: (collapsed: boolean) => void
  schema: Schema
  type: ObjectSchemaType
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
    onSetCollapsed,
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
  const {unstable_formBuilder: formBuilder} = useSource()

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

  const resolveInputComponent = useCallback(
    (inputType: SchemaType) => {
      const resolved = defaultInputResolver(
        formBuilder.components?.inputs || {},
        formBuilder.resolveInputComponent,
        inputType
      )
      return resolved || (fallbackInputs[inputType.jsonType] as React.ComponentType<FormInputProps>)
    },
    [formBuilder]
  )

  const renderField = useCallback(
    (field: RenderFieldCallbackArg) => {
      const Input = resolveInputComponent(field.type)
      if (!Input) {
        return <div>No input resolved for type: {field.type.name}</div>
      }
      return (
        // <Card radius={2} shadow={1} padding={2}>
        //   <Text>PATH: {JSON.stringify(field.path)}</Text>
        <Input {...field} validation={[]} presence={[]} renderField={renderField} />
        // </Card>
      )
    },
    [resolveInputComponent]
  )

  return (
    <SanityFormBuilderProvider __internal_patchChannel={patchChannel} schema={schema} value={value}>
      <DocumentInput
        level={0}
        onBlur={onBlur}
        onChange={handleChange}
        onFocus={handleFocus}
        presence={presence}
        readOnly={readOnly}
        ref={inputRef}
        type={type}
        members={members}
        groups={groups}
        onSelectGroup={onSelectGroup}
        onSetCollapsed={onSetCollapsed}
        renderField={renderField}
        value={value}
      />
    </SanityFormBuilderProvider>
  )
}
