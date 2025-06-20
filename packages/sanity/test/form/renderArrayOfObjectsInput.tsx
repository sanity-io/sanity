import {type ArraySchemaType, type FieldDefinition} from '@sanity/types'
import {vi} from 'vitest'

import type {ArrayOfObjectsFormNode} from '../../src/core/form/store/types/nodes'
import {
  type ArrayOfObjectsInputProps,
  type ComplexElementProps,
} from '../../src/core/form/types/inputProps'
import {
  defaultRenderAnnotation,
  defaultRenderBlock,
  defaultRenderField,
  defaultRenderInlineBlock,
  defaultRenderInput,
  defaultRenderItem,
  defaultRenderPreview,
} from '../../src/core/form/studio/defaults'
import type {FieldMember} from '../../src/core/form/store/types/members'
import {renderInput, type TestRenderInputContext, type TestRenderInputProps} from './renderInput'
import {type TestRenderProps} from './types'

const noopRenderDefault = () => <></>

export type TestRenderArrayOfObjectInputCallback = (
  inputProps: ArrayOfObjectsInputProps,
) => React.JSX.Element

export async function renderArrayOfObjectsInput(options: {
  fieldDefinition: FieldDefinition<'array'>
  props?: TestRenderProps
  render: TestRenderArrayOfObjectInputCallback
}) {
  const {fieldDefinition, props, render} = options

  const onItemAppend = vi.fn()
  const onItemClose = vi.fn()
  const onCollapse = vi.fn()
  const onItemCollapse = vi.fn()
  const onExpand = vi.fn()
  const onItemExpand = vi.fn()
  const onPathFocus = vi.fn()
  const onInsert = vi.fn()
  const onItemMove = vi.fn()
  const onItemOpen = vi.fn()
  const onItemPrepend = vi.fn()
  const onUpload = vi.fn()
  const onItemRemove = vi.fn()

  let initialValueId = 0
  const resolveInitialValue = () => Promise.resolve({_key: String(initialValueId++)})

  function transformProps(
    baseProps: TestRenderInputProps<ComplexElementProps>,
    context: TestRenderInputContext,
  ): ArrayOfObjectsInputProps {
    const {focusPath, path, schemaType, value, ...restProps} = baseProps
    const {formState} = context
    const fieldMember = formState.members?.find(
      (member) => member.kind === 'field' && member.name === fieldDefinition.name,
    ) as FieldMember<ArrayOfObjectsFormNode> | undefined
    const field = fieldMember?.field

    return {
      ...restProps,
      changed: false,
      focusPath,
      members: field?.members || [],
      onItemAppend,
      onItemClose,
      onItemCollapse,
      onItemExpand,
      onPathFocus,
      onInsert,
      onItemMove,
      onItemOpen,
      onItemPrepend,
      onItemRemove,
      resolveUploader: () => null,
      onUpload,
      path,
      renderAnnotation: defaultRenderAnnotation,
      renderBlock: defaultRenderBlock,
      renderField: defaultRenderField,
      renderInlineBlock: defaultRenderInlineBlock,
      renderInput: defaultRenderInput,
      renderItem: defaultRenderItem,
      renderPreview: defaultRenderPreview,
      resolveInitialValue,
      schemaType: schemaType as ArraySchemaType,
      value: value as {_key: string}[],
      renderDefault: noopRenderDefault,
    }
  }

  const ret = await renderInput<ComplexElementProps>({
    fieldDefinition,
    props,
    render: (inputProps, context) => render(transformProps(inputProps, context)),
  })

  return ret
}
