/* eslint-disable @typescript-eslint/no-explicit-any */

import {FormInputProps} from '@sanity/base/form'
import {ObjectSchemaType} from '@sanity/types'
import React from 'react'
import {ObjectInput} from '../src/inputs/ObjectInput'
import {ObjectInputProps} from '../src/inputs/ObjectInput/ObjectInput'
import {renderNode} from './renderNode'

export function renderObjectInput(options: {
  props?: Partial<FormInputProps<any, ObjectSchemaType>> & {ref?: React.Ref<any>}
  type: any // SchemaTypeDefinition
}) {
  return renderInput<ObjectInputProps>({
    ...options,
    render: (props) => <ObjectInput {...props} />,
  })
}

export function renderInput<InputProps extends FormInputProps<any, any>>(options: {
  props?: Partial<InputProps> & {ref?: React.Ref<any>}
  render: (props: InputProps) => React.ReactNode
  type: any
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
    ...(restProps as any),
  }

  const scope = renderNode({
    render: (props) => renderFn({...(initialProps as any), ...props, ref}),
    type: typeDef,
  })

  function rerender(props: Partial<InputProps> & {ref?: React.Ref<any>}) {
    scope.rerender({...initialProps, ...props, ref})
  }

  return {onChange, onFocus, rerender, result: scope.result}
}
