import {
  type AssetSource,
  type FieldDefinition,
  type ImageSchemaType,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {EMPTY} from 'rxjs'

import type {ImageUrlBuilder} from '../../src/core/form/inputs/files/types'
import type {ObjectInputProps} from '../../src/core/form/types/inputProps'
import type {BaseImageInputProps} from '../../src/core/form/inputs/files/ImageInput'
import {type TestRenderInputContext} from './renderInput'
import {renderObjectInput} from './renderObjectInput'
import {type TestRenderProps} from './types'

export type TestRenderImageInputCallback = (
  inputProps: BaseImageInputProps,
  context: TestRenderInputContext,
) => React.JSX.Element

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
      t: (key: string, values?: Record<string, string>) => key,
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

  return result
}
