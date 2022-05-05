/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react'
import {FIXME, FieldProps, ObjectFieldProps, ObjectInputProps} from '../types'
import {ObjectInput} from '../inputs/ObjectInput/ObjectInput'
import {renderNode} from './renderNode'

export function renderObjectInput(options: {
  props?: Partial<ObjectInputProps> & {ref?: React.Ref<FIXME>}
  type: FIXME // SchemaTypeDefinition
}) {
  return renderInput({
    ...options,
    render: (props) => <ObjectInput {...(props as FIXME)} />,
  })
}

export function renderInput<InputProps extends ObjectInputProps>(options: {
  props?: Partial<InputProps> & {ref?: React.Ref<any>}
  render: (props: InputProps) => React.ReactNode
  type: FIXME
}) {
  const {props: baseProps, render: renderFn, type: typeDef} = options

  const {
    focusPath = [],
    level = 0,
    presence = [],
    ref,
    validation = [],
    ...restProps
  } = baseProps || {}

  const onBlur = jest.fn()
  const onChange = jest.fn()
  const onFocus = jest.fn()

  const initialProps: Omit<InputProps, 'type'> = {
    focusPath,
    level,
    onBlur,
    onChange,
    onFocus,
    presence,
    validation,
    ...(restProps as FIXME),
  }

  const scope = renderNode({
    render: (props) => renderFn({...(initialProps as FIXME), ...props, ref}),
    type: typeDef,
  })

  function rerender(props: Partial<InputProps> & {ref?: React.Ref<FIXME>}) {
    scope.rerender({...initialProps, ...props, ref})
  }

  return {onChange, onFocus, rerender, result: scope.result}
}
