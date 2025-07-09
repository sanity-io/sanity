// import {type AssetSource, type FieldDefinition, type SchemaTypeDefinition} from '@sanity/types'
// import {EMPTY} from 'rxjs'

import {type AssetSource, type FieldDefinition, type SchemaTypeDefinition} from '@sanity/types'
import {EMPTY} from 'rxjs'

import {type TestRenderInputContext} from '../../../../../test/form/renderInput'
import {renderObjectInput} from '../../../../../test/form/renderObjectInput'
import {type TestRenderProps} from '../../../../../test/form/types'
import {type ObjectInputProps} from '../../../../core/form/types/inputProps'
import {sourceName} from '../../asset-source'
import {type VideoSchemaType} from '../../schemas/types'
import {type BaseVideoInputProps} from '../VideoInput'

// The video input filters asset sources and only allows the media library source
const STUB_ASSET_SOURCES: AssetSource[] = [{Uploader: {}, name: sourceName} as AssetSource] // @todo

const STUB_OBSERVE_ASSET = () => EMPTY

const STUB_RESOLVE_UPLOADER = () => ({
  priority: 1,
  type: 'video',
  accepts: 'video/*',
  upload: () => EMPTY,
})

export type TestRenderVideoInputCallback = (
  inputProps: BaseVideoInputProps,
  context: TestRenderInputContext,
) => React.JSX.Element

export async function renderVideoInput(options: {
  assetSources?: BaseVideoInputProps['assetSources']
  fieldDefinition: SchemaTypeDefinition<'video'>
  observeAsset?: BaseVideoInputProps['observeAsset']
  props?: TestRenderProps
  render: TestRenderVideoInputCallback
  resolveUploader?: BaseVideoInputProps['resolveUploader']
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
  ): BaseVideoInputProps {
    const {schemaType, value, ...restProps} = inputProps
    const {client} = context

    return {
      ...restProps,
      assetSources,
      client,
      directUploads: true,
      observeAsset,
      resolveUploader,
      schemaType: schemaType as VideoSchemaType,
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
