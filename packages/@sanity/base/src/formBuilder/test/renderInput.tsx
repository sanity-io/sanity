/* eslint-disable @typescript-eslint/no-explicit-any */

import {ObjectSchemaType} from '@sanity/types'
import React from 'react'
import {FormInputProps} from '../../form/types'
import {ObjectInput, ObjectInputProps} from '../inputs/ObjectInput/ObjectInput'
import {FIXME} from '../types'
import {renderNode} from './renderNode'

export function renderObjectInput(options: {
  props?: Partial<FormInputProps<any, ObjectSchemaType>> & {ref?: React.Ref<FIXME>}
  type: FIXME // SchemaTypeDefinition
}) {
  return renderInput<ObjectInputProps>({
    ...options,
    render: (props) => <ObjectInput {...props} />,
  })
}

export function renderInput<InputProps extends FormInputProps<any, any>>(options: {
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
