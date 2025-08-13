import {
  type AssetSource,
  type FieldDefinition,
  type FileSchemaType,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {EMPTY} from 'rxjs'

import type {ObjectInputProps} from '../../src/core/form/types/inputProps'
import type {BaseFileInputProps} from '../../src/core/form/inputs/files/FileInput/FileInput'
import {type TestRenderInputContext} from './renderInput'
import {renderObjectInput} from './renderObjectInput'
import {type TestRenderProps} from './types'

const STUB_ASSET_SOURCES: AssetSource[] = [{Uploader: {}, name: 'test-source'} as AssetSource] // @todo

const STUB_OBSERVE_ASSET = () => EMPTY

const STUB_RESOLVE_UPLOADER = () => ({
  priority: 1,
  type: 'file',
  accepts: 'file/*',
  upload: () => EMPTY,
})

export type TestRenderFileInputCallback = (
  inputProps: BaseFileInputProps,
  context: TestRenderInputContext,
) => React.JSX.Element

export async function renderFileInput(options: {
  assetSources?: BaseFileInputProps['assetSources']
  fieldDefinition: SchemaTypeDefinition<'file'>
  observeAsset?: BaseFileInputProps['observeAsset']
  props?: TestRenderProps
  render: TestRenderFileInputCallback
  resolveUploader?: BaseFileInputProps['resolveUploader']
}) {
  const {
    assetSources = STUB_ASSET_SOURCES,
    fieldDefinition,
    observeAsset = STUB_OBSERVE_ASSET,
    props,
    render: initialRender,
    resolveUploader = STUB_RESOLVE_UPLOADER,
  } = options

  function transformProps(
    inputProps: ObjectInputProps,
    context: TestRenderInputContext,
  ): BaseFileInputProps {
    const {schemaType, value, ...restProps} = inputProps
    const {client} = context

    return {
      ...restProps,
      assetSources,
      client,
      t: (key: string, values?: Record<string, string>) => key,
      directUploads: true,
      observeAsset,
      resolveUploader,
      schemaType: schemaType as FileSchemaType,
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
