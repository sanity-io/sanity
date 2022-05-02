/* eslint-disable react/jsx-handler-names */
import {ObjectSchemaType, Path, Schema, SchemaType, ValidationMarker} from '@sanity/types'
import React, {useCallback, useRef} from 'react'

import {DocumentInput} from '../inputs/DocumentInput'
import {useSource} from '../../studio'
import {fallbackInputs} from '../fallbackInputs'
import {
  assertType,
  isArrayInputProps,
  isBooleanField,
  isObjectInputProps,
  isPrimitiveField,
} from '../utils/asserters'
import {
  ArrayOfObjectsInputProps,
  BooleanInputProps,
  InputProps,
  NumberInputProps,
  ObjectInputProps,
  RenderFieldCallback,
  RenderInputCallback,
  StringInputProps,
} from '../types'
import {PatchChannel} from '../patch/PatchChannel'
import {FormFieldPresence} from '../../presence'
import {PatchEvent} from '../patch'
import {ObjectMember} from '../store/types/members'
import {StudioFormBuilderProvider} from './StudioFormBuilderProvider'
import {defaultResolveInputComponent as defaultInputResolver} from './inputResolver/inputResolver'
import {FormCallbacksProvider} from './contexts/FormCallbacks'
import {ObjectNode} from '../store/types/nodes'
import {FormField, FormFieldSet} from '../../components/formField'
import {Card} from '@sanity/ui'

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
    (nodeType: SchemaType): React.ComponentType<InputProps> => {
      const configuredInput = formBuilderConfig.components?.inputs?.[nodeType.name]?.input
      const resolved = configuredInput || defaultInputResolver(nodeType)
      return resolved || fallbackInputs[nodeType.jsonType]
    },
    [formBuilderConfig]
  )

  const renderInput: RenderInputCallback = useCallback(
    (inputProps) => {
      const Input = resolveInputComponent(inputProps.schemaType)
      if (!Input) {
        return <div>No input resolved for type: {inputProps.schemaType.name}</div>
      }
      if (isObjectInputProps(inputProps)) {
        assertType<React.ComponentType<ObjectInputProps>>(Input)
        return <Input {...inputProps} />
      }
      if (isArrayInputProps(inputProps)) {
        assertType<React.ComponentType<ArrayOfObjectsInputProps>>(Input)
        return <>Todo: array</>
        // return (
        //   <div>
        //     {field.name}: <StudioArrayInput {...field.inputProps} />
        //   </div>
        // )
      }
      assertType<React.ComponentType<StringInputProps | NumberInputProps | BooleanInputProps>>(
        Input
      )
      return <Input {...inputProps} />
    },
    [resolveInputComponent]
  )

  const renderField: RenderFieldCallback = useCallback((field) => {
    if (isBooleanField(field)) {
      return field.children
    }
    if (isPrimitiveField(field)) {
      return (
        <FormField level={field.level} title={field.title} description={field.description}>
          {field.children}
        </FormField>
      )
    }
    return (
      <FormFieldSet
        level={field.level}
        title={field.title}
        description={field.description}
        collapsed={field.collapsed}
        collapsible={field.collapsible}
        onSetCollapsed={field.onSetCollapsed}
      >
        <Card padding={2} border radius={2}>
          {String(field.level)}
          {field.children}
        </Card>
      </FormFieldSet>
    )
  }, [])

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
        <DocumentInput
          compareValue={undefined}
          focusRef={useRef(null)}
          level={0}
          id={id}
          path={[]}
          focused={focused}
          focusPath={focusPath}
          onBlur={handleBlur}
          onChange={onChange}
          onFocus={handleFocus}
          readOnly={readOnly}
          schemaType={schemaType}
          members={members}
          groups={groups}
          onSelectFieldGroup={handleSelectFieldGroup}
          onSetCollapsed={handleSetCollapsed}
          onSetFieldCollapsed={handleSetFieldCollapsed}
          onSetFieldSetCollapsed={handleSetFieldSetCollapsed}
          renderInput={renderInput}
          renderField={renderField}
          value={value}
        />
      </FormCallbacksProvider>
    </StudioFormBuilderProvider>
  )
}
