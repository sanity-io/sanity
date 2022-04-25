import {Schema, SchemaType} from '@sanity/types'
import React, {useCallback, useRef} from 'react'

import {DocumentInput} from '../inputs/DocumentInput'
import {useSource} from '../../studio'
import {fallbackInputs} from '../fallbackInputs'
import {ChangeIndicatorProvider} from '../../components/changeIndicators'
import {assertType, isArrayField, isObjectField} from '../utils/asserters'
import {
  ArrayInputComponentProps,
  BooleanInputComponentProps,
  FIXME,
  NumberInputComponentProps,
  ObjectInputComponentProps,
  ObjectInputProps,
  RenderArrayItemCallbackArg,
  RenderFieldCallbackArg,
  StringInputComponentProps,
} from '../types'
import {PatchChannel} from '../patch/PatchChannel'
import {StudioFormBuilderProvider} from './StudioFormBuilderProvider'
import {resolveInputComponent as defaultInputResolver} from './inputResolver/inputResolver'

/**
 * @alpha
 */
export interface StudioFormBuilderProps extends ObjectInputProps {
  changesOpen: boolean
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
export function StudioFormBuilder(props: StudioFormBuilderProps) {
  const {
    __internal_patchChannel: patchChannel,
    compareValue,
    focusPath,
    focused,
    groups,
    id,
    level,
    members,
    onBlur,
    onChange,
    onFocus,
    onSelectFieldGroup,
    onSetCollapsed,
    path,
    presence,
    readOnly,
    schema,
    type,
    validation,
    value,
    ...restProps
  } = props

  const {unstable_formBuilder: formBuilder} = useSource()

  const resolveInputComponent = useCallback(
    (inputType: SchemaType): React.ComponentType<unknown> => {
      const resolved = defaultInputResolver(
        formBuilder.components?.inputs,
        formBuilder.resolveInputComponent,
        inputType
      )
      return resolved || (fallbackInputs[inputType.jsonType] as FIXME)
    },
    [formBuilder]
  )

  const renderField = useCallback(
    (field: RenderFieldCallbackArg) => {
      const Input = resolveInputComponent(field.type)
      if (!Input) {
        return <div>No input resolved for type: {field.type.name}</div>
      }
      if (isObjectField(field)) {
        assertType<React.ComponentType<ObjectInputComponentProps>>(Input)
        return (
          <ChangeIndicatorProvider path={field.path} value={field.value} compareValue={undefined}>
            <Input {...field} renderField={renderField} />
          </ChangeIndicatorProvider>
        )
      }
      if (isArrayField(field)) {
        assertType<React.ComponentType<ArrayInputComponentProps>>(Input)
        return (
          <ChangeIndicatorProvider path={field.path} value={field.value} compareValue={undefined}>
            <Input {...field} renderItem={renderItem} />
          </ChangeIndicatorProvider>
        )
      }
      assertType<
        React.ComponentType<
          StringInputComponentProps | NumberInputComponentProps | BooleanInputComponentProps
        >
      >(Input)
      return (
        <ChangeIndicatorProvider path={field.path} value={field.value} compareValue={undefined}>
          <Input {...field} />
        </ChangeIndicatorProvider>
      )
    },
    [resolveInputComponent]
  )

  const renderItem = useCallback(
    (item: RenderArrayItemCallbackArg) => {
      const Input = resolveInputComponent(item.type)
      if (!Input) {
        return <div>No input resolved for type: {item.type.name}</div>
      }
      assertType<React.ComponentType<ObjectInputComponentProps>>(Input)
      return (
        <ChangeIndicatorProvider path={item.path} value={item.value} compareValue={undefined}>
          <Input {...item} renderField={renderField} />
        </ChangeIndicatorProvider>
      )
    },
    [resolveInputComponent]
  )

  return (
    <StudioFormBuilderProvider
      __internal_patchChannel={patchChannel}
      renderField={renderField}
      schema={schema}
      value={value}
    >
      <DocumentInput
        compareValue={compareValue}
        focusRef={useRef(null)}
        level={0}
        id={id}
        path={path}
        focused={focused}
        focusPath={focusPath}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        presence={presence}
        validation={validation}
        readOnly={readOnly}
        type={type}
        members={members}
        groups={groups}
        onSelectFieldGroup={onSelectFieldGroup}
        onSetCollapsed={onSetCollapsed}
        renderField={renderField}
        value={value}
      />
    </StudioFormBuilderProvider>
  )
}
