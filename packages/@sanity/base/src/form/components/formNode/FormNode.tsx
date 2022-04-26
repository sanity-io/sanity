import React, {createElement, useCallback, useMemo} from 'react'
import {ChangeIndicatorProvider} from '../../../components/changeIndicators'
import {PatchArg} from '../../patch'
import {
  ArrayInputProps,
  FieldProps,
  FIXME,
  Focusable,
  InputProps,
  ObjectInputProps,
  RenderArrayItemCallback,
  RenderFieldCallback,
} from '../../types'
import {useFormBuilder} from '../../useFormBuilder'
import {FormNodeProvider} from './FormNodeProvider'

export function FormNode(props: {
  children?: React.ReactNode
  component?: React.ComponentType<InputProps>
  fieldProps: FieldProps
  fieldRef?: React.Ref<Focusable>
  renderField: RenderFieldCallback
  renderItem: RenderArrayItemCallback
}) {
  const {onChange, onSetCollapsed} = useFormBuilder()

  const {
    children: childrenProp,
    component: inputComponent,
    fieldProps,
    fieldRef,
    renderField,
    renderItem,
  } = props

  const {
    collapsed,
    collapsible,
    compareValue,
    id,
    level,
    path,
    presence,
    readOnly,
    validation,
    ...restFieldProps
  } = fieldProps

  // NOTE: this is mainly used by legacy React class components
  const __internal: InputProps['__internal'] = useMemo(
    () => ({
      compareValue,
      level,
      path,
      presence,
      validation,
    }),
    [compareValue, level, path, presence, validation]
  )

  const inputProps: InputProps['inputProps'] = useMemo(
    () => ({
      id,
      onBlur: () => undefined,
      onFocus: () => undefined,
      readOnly,
      ref: fieldRef || (() => undefined),
    }),
    [fieldRef, id, readOnly]
  )

  const handleChange = useCallback(
    (...patches: PatchArg[]) => {
      onChange(path, ...patches)
    },
    [onChange, path]
  )

  const handleSetCollapsed = useCallback(
    (nextCollapsed: boolean) => {
      onSetCollapsed(path, nextCollapsed)
    },
    [onSetCollapsed, path]
  )

  // Render the input component
  let children = childrenProp
  if (inputComponent) {
    if (restFieldProps.kind === 'object') {
      children = createElement(inputComponent as React.ComponentType<ObjectInputProps>, {
        ...restFieldProps,
        __internal: __internal as FIXME,
        inputProps,
        onChange: handleChange,
        onSelectFieldGroup: () => console.warn('todo'),
        onSetCollapsed: handleSetCollapsed,
        renderField,
      })
    } else if (restFieldProps.kind === 'array') {
      children = createElement(inputComponent as React.ComponentType<ArrayInputProps>, {
        ...restFieldProps,
        __internal: __internal as FIXME,
        inputProps,
        onChange: handleChange,
        onInsert: () => console.warn('todo'),
        onSetCollapsed: handleSetCollapsed,
        renderItem,
      })
    } else {
      children = createElement(inputComponent, {
        ...restFieldProps,
        __internal: __internal as FIXME,
        inputProps,
        onChange: handleChange,
      })
    }
  }

  return (
    <FormNodeProvider
      collapsed={collapsed}
      collapsible={collapsible}
      compareValue={compareValue}
      inputId={id}
      level={level}
      path={path}
      presence={presence}
      type={fieldProps.type}
      validation={validation}
    >
      <ChangeIndicatorProvider compareValue={compareValue} path={path} value={fieldProps.value}>
        {children}
      </ChangeIndicatorProvider>
    </FormNodeProvider>
  )
}
