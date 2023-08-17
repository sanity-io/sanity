import {ImageSchemaType, AssetSource, FieldDefinition, SchemaTypeDefinition} from '@sanity/types'
import React from 'react'
import {EMPTY} from 'rxjs'
import {ObjectInputProps, ImageUrlBuilder} from '../../src/core'
import {BaseImageInputProps} from '../../src/core/form/inputs/files/ImageInput'
import {renderObjectInput} from './renderObjectInput'
import {TestRenderProps} from './types'
import {TestRenderInputContext} from './renderInput'

export type TestRenderImageInputCallback = (
  inputProps: BaseImageInputProps,
  context: TestRenderInputContext,
) => React.ReactElement

export async function renderImageInput(options: {
  fieldDefinition: SchemaTypeDefinition<'image'>
  props?: TestRenderProps
  render: TestRenderImageInputCallback
}) {
  const {fieldDefinition, props, render: initialRender} = options

  const assetSources: AssetSource[] = [] // @todo
  const imageUrlBuilder = {} as ImageUrlBuilder
  const observeAsset = () => EMPTY
  const resolveUploader = () => null

  function transformProps(
    inputProps: ObjectInputProps,
    context: TestRenderInputContext,
  ): BaseImageInputProps {
    const {schemaType, value, ...restProps} = inputProps
    const {client} = context

    return {
      ...restProps,
      assetSources,
      client,
      imageUrlBuilder,
      observeAsset,
      resolveUploader,
      schemaType: schemaType as ImageSchemaType,
      value: value as Record<string, any>,
    }
  }

  const result = await renderObjectInput({
    fieldDefinition: fieldDefinition as FieldDefinition<'object'>,
    props,
    render: (inputProps, context) => initialRender(transformProps(inputProps, context), context),
  })

  function rerender(subsequentRender: TestRenderImageInputCallback) {
    result.rerender((inputProps, context) =>
      subsequentRender(transformProps(inputProps, context), context),
    )
  }

  return {...result, rerender}
}
