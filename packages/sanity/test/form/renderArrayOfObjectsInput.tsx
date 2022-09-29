import {ArraySchemaType, FieldDefinition} from '@sanity/types'
import React from 'react'
import {
  ArrayOfObjectsFormNode,
  ArrayOfObjectsInputProps,
  ComplexElementProps,
  FieldMember,
  defaultRenderField,
  defaultRenderInput,
  defaultRenderItem,
  defaultRenderPreview,
} from '../../src/core'
import {renderInput, TestRenderInputContext, TestRenderInputProps} from './renderInput'
import {TestRenderProps} from './types'

const noopRenderDefault = () => <></>

export type TestRenderArrayOfObjectInputCallback = (
  inputProps: ArrayOfObjectsInputProps
) => React.ReactElement

export async function renderArrayOfObjectsInput(options: {
  fieldDefinition: FieldDefinition<'array'>
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
  const onItemMove = jest.fn()
  const onOpenItem = jest.fn()
  const onPrependItem = jest.fn()
  const onUpload = jest.fn()
  const onRemoveItem = jest.fn()

  let initialValueId = 0
  const resolveInitialValue = () => Promise.resolve({_key: String(initialValueId++)})

  function transformProps(
    baseProps: TestRenderInputProps<ComplexElementProps>,
    context: TestRenderInputContext
  ): ArrayOfObjectsInputProps {
    const {focusPath, path, schemaType, value, ...restProps} = baseProps
    const {formState} = context
    const fieldMember = formState.members?.find(
      (member) => member.kind === 'field' && member.name === fieldDefinition.name
    ) as FieldMember<ArrayOfObjectsFormNode> | undefined
    const field = fieldMember?.field

    return {
      ...restProps,
      changed: false,
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
      onItemMove,
      onOpenItem,
      onPrependItem,
      onRemoveItem,
      resolveUploader: () => null,
      onUpload,
      path,
      renderField: defaultRenderField,
      renderInput: defaultRenderInput,
      renderItem: defaultRenderItem,
      renderPreview: defaultRenderPreview,
      resolveInitialValue,
      schemaType: schemaType as ArraySchemaType,
      value: value as any[],
      renderDefault: noopRenderDefault,
    }
  }

  const ret = await renderInput({
    fieldDefinition,
    props,
    render: (inputProps, context) => render(transformProps(inputProps, context)),
  })

  function rerender(renderFn: TestRenderArrayOfObjectInputCallback) {
    return ret.rerender((inputProps, context) => renderFn(transformProps(inputProps, context)))
  }

  return {...ret, onAppendItem, rerender}
}
