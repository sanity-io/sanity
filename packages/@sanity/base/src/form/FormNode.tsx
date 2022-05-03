import React, {createElement, useMemo} from 'react'
import {FormNodeProvider} from './FormNodeProvider'
import {
  ArrayInputProps,
  FieldProps,
  InputProps,
  ObjectInputProps,
  RenderArrayItemCallback,
  RenderFieldCallback,
} from './types'

export function FormNode(props: {
  component: React.ComponentType<InputProps>
  fieldProps: FieldProps
  fieldRef: React.Ref<Focusable>
  renderField: RenderFieldCallback
  renderItem: RenderArrayItemCallback
}) {
  const {component: inputComponent, fieldProps, fieldRef, renderField, renderItem} = props
  const {id, readOnly, ...restInputProps} = fieldProps

  const inputProps: InputProps['inputProps'] = useMemo(
    () => ({
      id,
      onBlur: () => undefined,
      onFocus: () => undefined,
      readOnly,
      ref: fieldRef,
    }),
    [fieldRef, id, readOnly]
  )

  // Render the input component
  let children: React.ReactNode
  if (restInputProps.kind === 'object') {
    children = createElement(inputComponent as React.ComponentType<ObjectInputProps>, {
      ...restInputProps,
      inputProps,
      onChange: () => console.warn('todo'),
      onSelectFieldGroup: () => console.warn('todo'),
      onSetCollapsed: () => console.warn('todo'),
      renderField,
    })
  } else if (restInputProps.kind === 'array') {
    children = createElement(inputComponent as React.ComponentType<ArrayInputProps>, {
      ...restInputProps,
      inputProps,
      onChange: () => console.warn('todo'),
      onInsert: () => console.warn('todo'),
      onSetCollapsed: () => console.warn('todo'),
      renderItem,
    })
  } else {
    children = createElement(inputComponent, {
      ...restInputProps,
      inputProps,
      onChange: () => console.warn('todo'),
    })
  }

  return <FormNodeProvider fieldProps={fieldProps}>{children}</FormNodeProvider>
}
