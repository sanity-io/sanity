import {Schema, SchemaType} from '@sanity/types'
import React, {useCallback, useEffect, useRef} from 'react'
import {FormBuilderInputInstance} from '../FormBuilderInput'
import {PatchChannel} from '../patchChannel'
import {DocumentInput} from '../inputs/DocumentInput/DocumentInput'
import {useSource} from '../../studio'
import {FormInputProps} from '../types'
import {fallbackInputs} from '../fallbackInputs'
import {SanityFormBuilderProvider} from './SanityFormBuilderProvider'
import {resolveInputComponent as defaultInputResolver} from './inputResolver/inputResolver'
import {RenderFieldCallbackArg} from '../types_v3'
import {ObjectInputProps} from '../store/formState'

/**
 * @alpha
 */
export interface SanityFormBuilderProps extends ObjectInputProps {
  changesOpen: boolean
  compareValue?: any | null
  /**
   * @internal Considered internal – do not use.
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  autoFocus?: boolean
  readOnly?: boolean
  schema: Schema
}

/**
 * @alpha
 */
export function SanityFormBuilder(props: SanityFormBuilderProps) {
  const {
    __internal_patchChannel: patchChannel,
    autoFocus,
    onBlur,
    id,
    path,
    focused,
    onChange,
    onFocus,
    onSelectFieldGroup,
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
        //   <Text>Presence: {JSON.stringify(field.presence)}</Text>
        <Input
          {...field}
          /* @ts-ignore */
          renderField={renderField}
        />
        // </Card>
      )
    },
    [resolveInputComponent]
  )

  return (
    <SanityFormBuilderProvider __internal_patchChannel={patchChannel} schema={schema} value={value}>
      <DocumentInput
        level={0}
        id={id}
        path={path}
        focused={focused}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        presence={presence}
        validation={validation}
        readOnly={readOnly}
        ref={inputRef as any}
        type={type}
        members={members}
        groups={groups}
        onSelectFieldGroup={onSelectFieldGroup}
        onSetCollapsed={onSetCollapsed}
        renderField={renderField}
        value={value}
      />
    </SanityFormBuilderProvider>
  )
}
