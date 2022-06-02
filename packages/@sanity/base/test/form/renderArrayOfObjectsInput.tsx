import {Schema, ArraySchemaType} from '@sanity/types'
import React from 'react'
import {ArrayOfObjectsInputProps} from '../../src/form'
import {renderInput, TestRenderInputProps} from './renderInput'
import {TestRenderProps} from './types'

export type TestRenderArrayOfObjectInputCallback = (
  inputProps: ArrayOfObjectsInputProps
) => React.ReactElement

export function renderArrayOfObjectsInput(options: {
  fieldDefinition: Schema.TypeDefinition<'array'>
  props?: TestRenderProps
  render: TestRenderArrayOfObjectInputCallback
}) {
  const {fieldDefinition, props, render} = options

  const onAppendItem = jest.fn()
  const onCloseItem = jest.fn()
  const onCollapse = jest.fn()
  const onCollapseItem = jest.fn()
  const onExpand = jest.fn()
  const onExpandItem = jest.fn()
  const onFocusPath = jest.fn()
  const onInsert = jest.fn()
  const onMoveItem = jest.fn()
  const onOpenItem = jest.fn()
  const onPrependItem = jest.fn()
  const onRemoveItem = jest.fn()

  let initialValueId = 0
  const resolveInitialValue = () => Promise.resolve({_key: String(initialValueId++)})

  function transformProps(baseProps: TestRenderInputProps): ArrayOfObjectsInputProps {
    const {compareValue, focusPath, path, schemaType, value, ...restProps} = baseProps

    return {
      ...restProps,
      compareValue: compareValue as any[],
      focusPath,
      members: [],
      onAppendItem,
      onCloseItem,
      onCollapse,
      onCollapseItem,
      onExpand,
      onExpandItem,
      onFocusPath,
      onInsert,
      onMoveItem,
      onOpenItem,
      onPrependItem,
      onRemoveItem,
      path,
      validation: [],
      presence: [],
      renderField: () => <>TODO</>,
      renderInput: () => <>TODO</>,
      renderItem: () => <>TODO</>,
      resolveInitialValue,
      schemaType: schemaType as ArraySchemaType,
      value: value as any[],
    }
  }

  const ret = renderInput({
    fieldDefinition,
    props,
    render: (inputProps) => render(transformProps(inputProps)),
  })

  function rerender(renderFn: TestRenderArrayOfObjectInputCallback) {
    return ret.rerender((inputProps) => renderFn(transformProps(inputProps)))
  }

  return {...ret, onAppendItem, rerender}
}
