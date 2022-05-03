/* eslint-disable react/jsx-handler-names */
import {ObjectSchemaType, Path, Schema, SchemaType, ValidationMarker} from '@sanity/types'
import React, {useCallback, useRef} from 'react'

import {useSource} from '../../studio'
import {fallbackInputs} from '../fallbackInputs'
import {InputProps} from '../types'
import {PatchChannel} from '../patch/PatchChannel'
import {FormFieldPresence} from '../../presence'
import {FormPatch, PatchEvent} from '../patch'
import {ObjectMember} from '../store/types/members'
import {StudioFormBuilderProvider} from './StudioFormBuilderProvider'
import {defaultResolveInputComponent as defaultInputResolver} from './inputResolver/inputResolver'
import {FormCallbacksProvider} from './contexts/FormCallbacks'
import {ObjectNode} from '../store/types/nodes'
import {StudioObjectInput} from './StudioObjectInput'

/**
 * @alpha
 */
export interface StudioFormBuilderProps extends ObjectNode {
  id: string
  focused: boolean | undefined
  changesOpen: boolean
  onPathBlur: (path: Path) => void
  onPathFocus: (path: Path) => void
  onSetCollapsedPath: (path: Path, collapsed: boolean) => void
  onSetCollapsedFieldSet: (path: Path, collapsed: boolean) => void
  onSelectFieldGroup: (path: Path, groupName: string) => void
  focusPath: Path

  schemaType: ObjectSchemaType
  value: {[field in string]: unknown} | undefined
  onChange: (changeEvent: PatchEvent) => void
  /**
   * @internal Considered internal – do not use.
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  autoFocus?: boolean
  readOnly?: boolean
  presence: FormFieldPresence[]
  validation: ValidationMarker[]
  members: ObjectMember[]
  schema: Schema
}

/**
 * @alpha
 */
export function StudioFormBuilder(props: StudioFormBuilderProps) {
  const {
    __internal_patchChannel: patchChannel,
    // compareValue,
    focusPath,
    focused,
    id,
    onChange,
    onSelectFieldGroup,
    onPathFocus,
    onPathBlur,
    onSetCollapsedPath,
    onSetCollapsedFieldSet,
    members,
    groups,
    readOnly,
    schema,
    schemaType,
    value,
  } = props

  const {unstable_formBuilder: formBuilderConfig} = useSource()

  const resolveInputComponent = useCallback(
    (type: SchemaType): React.ComponentType<InputProps> => {
      const configuredInput = formBuilderConfig.components?.inputs?.[type.name]?.input
      const resolved =
        configuredInput ||
        formBuilderConfig.resolveInputComponent?.(type) ||
        defaultInputResolver(type)
      return resolved || fallbackInputs[type.jsonType]
    },
    [formBuilderConfig]
  )

  const handleBlur = useCallback(
    (event: React.FocusEvent) => {
      onPathBlur([])
    },
    [onPathBlur]
  )
  const handleFocus = useCallback(
    (event: React.FocusEvent) => {
      onPathFocus([])
    },
    [onPathFocus]
  )
  const handleSelectFieldGroup = useCallback(
    (groupName: string) => {
      onSelectFieldGroup([], groupName)
    },
    [onSelectFieldGroup]
  )

  const handleSetCollapsed = useCallback(
    (collapsed: boolean) => {
      onSetCollapsedPath([], collapsed)
    },
    [onSetCollapsedPath]
  )

  const handleChange = useCallback(
    (patch: FormPatch | FormPatch[] | PatchEvent) => {
      onChange(PatchEvent.from(patch))
    },
    [onChange]
  )

  const handleSetFieldCollapsed = useCallback(
    (fieldName: string, collapsed: boolean) => {
      onSetCollapsedPath([fieldName], collapsed)
    },
    [onSetCollapsedPath]
  )

  const handleSetFieldSetCollapsed = useCallback(
    (fieldSetName: string, collapsed: boolean) => {
      onSetCollapsedFieldSet([fieldSetName], collapsed)
    },
    [onSetCollapsedFieldSet]
  )

  return (
    <StudioFormBuilderProvider __internal_patchChannel={patchChannel} schema={schema} value={value}>
      <FormCallbacksProvider
        onSetCollapsedPath={props.onSetCollapsedPath}
        onSetCollapsedFieldSet={props.onSetCollapsedFieldSet}
        onSelectFieldGroup={props.onSelectFieldGroup}
        onPathBlur={props.onPathBlur}
        onPathFocus={props.onPathFocus}
        onChange={props.onChange}
      >
        <StudioObjectInput
          resolveInputComponent={resolveInputComponent}
          compareValue={undefined}
          focusRef={useRef(null)}
          level={0}
          id={id}
          path={[]}
          focused={focused}
          focusPath={focusPath}
          onBlur={handleBlur}
          onChange={handleChange}
          validation={[]}
          onFocusChildPath={onPathFocus}
          onFocus={handleFocus}
          readOnly={readOnly}
          schemaType={schemaType}
          members={members}
          groups={groups}
          onSelectFieldGroup={handleSelectFieldGroup}
          onSetCollapsed={handleSetCollapsed}
          onSetFieldCollapsed={handleSetFieldCollapsed}
          onSetFieldSetCollapsed={handleSetFieldSetCollapsed}
          value={value}
        />
      </FormCallbacksProvider>
    </StudioFormBuilderProvider>
  )
}
