import {Schema, ArraySchemaType} from '@sanity/types'
import React from 'react'
import {ArrayOfObjectsFormNode, ArrayOfObjectsInputProps, FieldMember} from '../../src/form'
import {renderInput, TestRenderInputContext, TestRenderInputProps} from './renderInput'
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

  function transformProps(
    baseProps: TestRenderInputProps,
    context: TestRenderInputContext
  ): ArrayOfObjectsInputProps {
    const {compareValue, focusPath, path, schemaType, value, ...restProps} = baseProps

    const {formState} = context
    const fieldMember = formState.members?.find(
      (member) => member.kind === 'field' && member.name === fieldDefinition.name
    ) as FieldMember<ArrayOfObjectsFormNode> | undefined
    const field = fieldMember?.field

    return {
      ...restProps,
      compareValue: compareValue as any[],
      focusPath,
      members: field?.members || [],
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
    render: (inputProps, context) => render(transformProps(inputProps, context)),
  })

  function rerender(renderFn: TestRenderArrayOfObjectInputCallback) {
    return ret.rerender((inputProps, context) => renderFn(transformProps(inputProps, context)))
  }

  return {...ret, onAppendItem, rerender}
}
