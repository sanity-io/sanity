import {
  defineType,
  type AssetSource,
  type FieldDefinition,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {EMPTY} from 'rxjs'

import {type ObjectInputProps} from '../../src/core/form/types/inputProps'
import {type VideoSchemaType} from '../../src/media-library/plugin/schemas/types'
import {type BaseVideoInputProps} from '../../src/media-library/plugin/VideoInput/VideoInput'
import {type TestRenderInputContext} from './renderInput'
import {renderObjectInput} from './renderObjectInput'
import {type TestRenderProps} from './types'

/**
 * Minimal stub for sanity.asset - Media Library backend type referenced by sanity.video's "media" field.
 * Not defined in Studio schema; added here so schema validation passes in tests.
 * Media library plugin already adds mediaLibrarySchemas when enabled; we only add this stub.
 */
const sanityAssetStub = defineType({
  name: 'sanity.asset',
  title: 'Asset (stub)',
  type: 'document',
  fields: [{name: 'placeholder', type: 'string', hidden: true}],
})

const videoTestSchemaTypes = [sanityAssetStub]

const STUB_ASSET_SOURCES: AssetSource[] = [{Uploader: {}, name: 'test-source'} as AssetSource]

const STUB_OBSERVE_ASSET = () => EMPTY

const STUB_RESOLVE_UPLOADER = () => ({
  priority: 1,
  type: 'file',
  accepts: 'video/*',
  upload: () => EMPTY,
})

export type TestRenderVideoInputCallback = (
  inputProps: BaseVideoInputProps,
  context: TestRenderInputContext,
) => React.JSX.Element

export async function renderVideoInput(options: {
  assetSources?: BaseVideoInputProps['assetSources']
  configOverrides?: Record<string, unknown>
  fieldDefinition: SchemaTypeDefinition<'sanity.video'>
  observeAsset?: BaseVideoInputProps['observeAsset']
  props?: TestRenderProps
  render: TestRenderVideoInputCallback
  resolveUploader?: BaseVideoInputProps['resolveUploader']
}) {
  const {
    assetSources = STUB_ASSET_SOURCES,
    configOverrides,
    fieldDefinition,
    observeAsset = STUB_OBSERVE_ASSET,
    props,
    render: initialRender,
    resolveUploader = STUB_RESOLVE_UPLOADER,
  } = options

  function transformProps(
    inputProps: ObjectInputProps,
    context: TestRenderInputContext,
  ): BaseVideoInputProps {
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
      schemaType: schemaType as VideoSchemaType,
      value: value as Record<string, unknown>,
    }
  }

  const result = await renderObjectInput({
    additionalSchemaTypes: videoTestSchemaTypes,
    configOverrides,
    fieldDefinition: fieldDefinition as FieldDefinition<'object'>,
    props,
    render: (inputProps, context) => initialRender(transformProps(inputProps, context), context),
  })

  return result
}
