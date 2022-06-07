import {Schema, ImageSchemaType, AssetSource} from '@sanity/types'
import React from 'react'
import {EMPTY} from 'rxjs'
import {ImageInputProps} from '../../src/form/inputs/files/ImageInput'
import {ImageUrlBuilder} from '../../src/form/inputs/files/types'
import {FieldMember, ObjectFormNode, ObjectInputProps} from '../../src/form'
import {renderObjectInput} from './renderObjectInput'
import {TestRenderProps} from './types'
import {TestRenderInputContext} from './renderInput'

export type TestRenderImageInputCallback = (
  inputProps: ImageInputProps,
  context: TestRenderInputContext
) => React.ReactElement

export function renderImageInput(options: {
  fieldDefinition: Schema.TypeDefinition<'image'>
  props?: TestRenderProps
  render: TestRenderImageInputCallback
}) {
  const {fieldDefinition, props, render: initialRender} = options

  const assetSources: AssetSource[] = [] // @todo
  const imageUrlBuilder = {} as ImageUrlBuilder
  const observeAsset = () => EMPTY
  const resolveUploader = () => null

  function transformProps(
    baseProps: ObjectInputProps,
    context: TestRenderInputContext
  ): ImageInputProps {
    const {schemaType, ...restProps} = baseProps
    const {client, formState} = context
    const fieldMember = formState.members?.find(
      (member) => member.kind === 'field' && member.name === fieldDefinition.name
    ) as FieldMember<ObjectFormNode> | undefined
    const field = fieldMember?.field

    return {
      ...restProps,
      assetSources,
      client,
      collapsed: false,
      groups: field?.groups || [],
      imageUrlBuilder,
      members: field?.members || [],
      observeAsset,
      renderField: () => <>TODO</>,
      renderInput: () => <>TODO</>,
      renderItem: () => <>TODO</>,
      resolveUploader,
      schemaType: schemaType as ImageSchemaType,
      value: baseProps.value as Record<string, any>,
    }
  }

  const result = renderObjectInput({
    fieldDefinition: fieldDefinition as Schema.TypeDefinition<'object'>,
    props,
    render: (baseProps, context) => initialRender(transformProps(baseProps, context), context),
  })

  function rerender(subsequentRender: TestRenderImageInputCallback) {
    result.rerender((inputProps, context) =>
      subsequentRender(transformProps(inputProps, context), context)
    )
  }

  return {...result, rerender}
}
