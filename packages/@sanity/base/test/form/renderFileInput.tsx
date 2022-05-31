import {Schema, FileSchemaType, AssetSource} from '@sanity/types'
import React from 'react'
import {EMPTY} from 'rxjs'
import {FileInputProps} from '../../src/form/inputs/files/FileInput'
import {ObjectInputProps} from '../../src/form'
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
  inputProps: FileInputProps,
  context: TestRenderInputContext
) => React.ReactElement

export function renderFileInput(options: {
  assetSources?: FileInputProps['assetSources']
  fieldDefinition: Schema.TypeDefinition<'file'>
  observeAsset?: FileInputProps['observeAsset']
  props?: TestRenderProps
  render: TestRenderFileInputCallback
  resolveUploader?: FileInputProps['resolveUploader']
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
    baseProps: ObjectInputProps,
    context: TestRenderInputContext
  ): FileInputProps {
    const {schemaType, ...restProps} = baseProps
    const {client} = context

    return {
      ...restProps,
      assetSources,
      client,
      collapsed: false,
      directUploads: true,
      groups: [],
      members: [],
      observeAsset,
      renderField: () => <>TODO</>,
      renderInput: () => <>TODO</>,
      renderItem: () => <>TODO</>,
      resolveUploader,
      schemaType: schemaType as FileSchemaType,
      value: baseProps.value as Record<string, any>,
    }
  }

  const result = renderObjectInput({
    fieldDefinition: fieldDefinition as Schema.TypeDefinition<'object'>,
    props,
    render: (baseProps, context) => initialRender(transformProps(baseProps, context), context),
  })

  function rerender(subsequentRender: TestRenderFileInputCallback) {
    result.rerender((inputProps, context) =>
      subsequentRender(transformProps(inputProps, context), context)
    )
  }

  return {...result, rerender}
}
