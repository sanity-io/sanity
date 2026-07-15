import {type ImageUrlBuilder} from '@sanity/image-url'
import {
  type AssetSource,
  type FieldDefinition,
  type ImageSchemaType,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {EMPTY} from 'rxjs'

import {type ObjectInputProps} from '../../src/core'
import {type BaseImageInputProps} from '../../src/core/form/inputs/files/ImageInput'
import {type TestRenderInputContext} from './renderInput'
import {renderObjectInput} from './renderObjectInput'
import {type TestRenderProps} from './types'

const STUB_ASSET_SOURCES: AssetSource[] = [{Uploader: {}, name: 'test-source'} as AssetSource]

const STUB_OBSERVE_ASSET = () => EMPTY

const STUB_RESOLVE_UPLOADER = () => ({
  priority: 1,
  type: 'image',
  accepts: 'image/*',
  upload: () => EMPTY,
})

export type TestRenderImageInputCallback = (
  inputProps: BaseImageInputProps,
  context: TestRenderInputContext,
) => React.JSX.Element

export async function renderImageInput(options: {
  assetSources?: BaseImageInputProps['assetSources']
  configOverrides?: Record<string, unknown>
  fieldDefinition: SchemaTypeDefinition<'image'>
  imageUrlBuilder?: ImageUrlBuilder
  observeAsset?: BaseImageInputProps['observeAsset']
  props?: TestRenderProps
  render: TestRenderImageInputCallback
  resolveUploader?: BaseImageInputProps['resolveUploader']
}) {
  const {
    assetSources = STUB_ASSET_SOURCES,
    configOverrides,
    fieldDefinition,
    imageUrlBuilder = {} as ImageUrlBuilder,
    observeAsset = STUB_OBSERVE_ASSET,
    props,
    render: initialRender,
    resolveUploader = STUB_RESOLVE_UPLOADER,
  } = options

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
      isUploading: false,
      observeAsset,
      resolveUploader,
      schemaType: schemaType as ImageSchemaType,
      value: value as Record<string, any>,
    }
  }

  const result = await renderObjectInput({
    configOverrides,
    fieldDefinition: fieldDefinition as FieldDefinition<'object'>,
    props,
    render: (inputProps, context) => initialRender(transformProps(inputProps, context), context),
  })

  return result
}
