import {Schema, SchemaType} from '@sanity/types'
import React, {createElement, useCallback, useRef} from 'react'
import {PatchChannel} from '../patch/PatchChannel'
import {DocumentInput} from '../inputs/DocumentInput'
import {useSource} from '../../studio'
import {fallbackInputs} from '../fallbackInputs'
import {
  ArrayInputComponentProps,
  BooleanInputComponentProps,
  FIXME,
  FieldProps,
  NumberInputComponentProps,
  ObjectInputComponentProps,
  ObjectInputProps,
  RenderArrayItemCallbackArg,
  RenderFieldCallback,
  RenderFieldCallbackArg,
  StringInputComponentProps,
} from '../types'
import {ChangeIndicatorProvider} from '../../components/changeIndicators'
import {assertType, isArrayField, isObjectField} from '../utils/asserters'
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
    (inputType: SchemaType): React.ComponentType<FieldProps> => {
      const resolved = defaultInputResolver(
        formBuilder.components?.inputs,
        formBuilder.resolveInputComponent,
        inputType
      )

      if (resolved) {
        return resolved
      }

      return fallbackInputs[inputType.jsonType]?.input as FIXME // React.ComponentType<FieldProps>
    },
    [formBuilder]
  )

  const renderField: RenderFieldCallback = useCallback(
    (field: RenderFieldCallbackArg) => {
      const inputComponent = resolveInputComponent(field.type)

      if (!inputComponent) {
        return <div>No input resolved for type: {field.type.name}</div>
      }

      if (isObjectField(field)) {
        assertType<React.ComponentType<ObjectInputComponentProps>>(inputComponent)

        return createElement(inputComponent as React.ComponentType<ObjectInputComponentProps>, {
          ...field,
          onSelectFieldGroup: () => undefined,
          renderField,
        })
      }

      if (isArrayField(field)) {
        assertType<React.ComponentType<ArrayInputComponentProps>>(inputComponent)

        return createElement(inputComponent as React.ComponentType<ArrayInputComponentProps>, {
          ...(field as FIXME),
          renderItem,
        })
      }

      assertType<
        React.ComponentType<
          StringInputComponentProps | NumberInputComponentProps | BooleanInputComponentProps
        >
      >(inputComponent)

      // return (
      //   <ChangeIndicatorProvider path={field.path} value={field.value} compareValue={undefined}>
      //     <Input {...field} />
      //   </ChangeIndicatorProvider>
      // )

      return createElement(inputComponent, field)
    },
    [resolveInputComponent]
  )

  const renderItem = useCallback(
    (item: RenderArrayItemCallbackArg) => {
      const inputComponent = resolveInputComponent(item.type)
      if (!inputComponent) {
        return <div>No input resolved for type: {item.type.name}</div>
      }
      assertType<React.ComponentType<ObjectInputComponentProps>>(inputComponent)
      return (
        <ChangeIndicatorProvider path={item.path} value={item.value} compareValue={undefined}>
          {createElement(inputComponent, {...item, renderField} as FIXME)}
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
        level={level}
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
