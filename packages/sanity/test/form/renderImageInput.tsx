import {Schema, ImageSchemaType, AssetSource} from '@sanity/types'
import React from 'react'
import {EMPTY} from 'rxjs'
import {ImageInputProps} from '../../src/form/inputs/files/ImageInput'
import {ImageUrlBuilder} from '../../src/form/inputs/files/types'
import {ObjectInputProps} from '../../src/form'
import {renderObjectInput} from './renderObjectInput'
import {TestRenderProps} from './types'
import {TestRenderInputContext} from './renderInput'

export type TestRenderImageInputCallback = (
  inputProps: ImageInputProps,
  context: TestRenderInputContext
) => React.ReactElement

export async function renderImageInput(options: {
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
    inputProps: ObjectInputProps,
    context: TestRenderInputContext
  ): ImageInputProps {
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
    fieldDefinition: fieldDefinition as Schema.FieldDefinition<'object'>,
    props,
    render: (inputProps, context) => initialRender(transformProps(inputProps, context), context),
  })

  function rerender(subsequentRender: TestRenderImageInputCallback) {
    result.rerender((inputProps, context) =>
      subsequentRender(transformProps(inputProps, context), context)
    )
  }

  return {...result, rerender}
}
