import {SchemaTypeDefinition, FileSchemaType, AssetSource, FieldDefinition} from '@sanity/types'
import React from 'react'
import {EMPTY} from 'rxjs'
import {ObjectInputProps} from '../../src/core'
import {BaseFileInputProps} from '../../src/core/form/inputs/files/FileInput'
import {renderObjectInput} from './renderObjectInput'
import {TestRenderProps} from './types'
import {TestRenderInputContext} from './renderInput'

const STUB_ASSET_SOURCES: AssetSource[] = [{} as any] // @todo

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
) => React.ReactElement

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

  function rerender(subsequentRender: TestRenderFileInputCallback) {
    result.rerender((inputProps, context) =>
      subsequentRender(transformProps(inputProps, context), context),
    )
  }

  return {...result, rerender}
}
