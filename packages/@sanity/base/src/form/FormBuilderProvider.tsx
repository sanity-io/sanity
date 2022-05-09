import {AssetSource, Schema} from '@sanity/types'
import React, {useMemo} from 'react'
import {Source} from '../config'
import {FIXME, FormBuilderFilterFieldFn} from './types'
import {FormBuilderContext, FormBuilderContextValue} from './FormBuilderContext'
import {PatchChannel} from './patch/PatchChannel'
import {DefaultArrayInputFunctions} from './inputs/arrays/common/ArrayFunctions'
import {DefaultMarkers} from './inputs/PortableText/_legacyDefaultParts/Markers'
import {DefaultCustomMarkers} from './inputs/PortableText/_legacyDefaultParts/CustomMarkers'
import {FileSource, ImageSource} from './studio/DefaultAssetSource'
import {EMPTY_ARRAY} from './utils/empty'
import {PatchEvent} from './patch'

const defaultFileAssetSources = [FileSource]
const defaultImageAssetSources = [ImageSource]

type SourceFormBuilder = Source['formBuilder']

export interface FormBuilderProviderProps extends SourceFormBuilder {
  /**
   * @internal
   */
  __internal_patchChannel?: PatchChannel // eslint-disable-line camelcase

  children?: React.ReactNode
  filterField?: FormBuilderFilterFieldFn
  onChange: (event: PatchEvent) => void
  schema: Schema
  value?: FIXME
}

const missingPatchChannel: PatchChannel = {
  publish: () => undefined,
  subscribe: () => {
    console.warn(
      'No patch channel provided to form-builder. If you need input based patch updates, please provide one'
    )

    return () => undefined
  },
}

export function FormBuilderProvider(props: FormBuilderProviderProps) {
  const {
    __internal_patchChannel: patchChannel = missingPatchChannel,
    children,
    file,
    filterField,
    image,
    onChange,
    resolveFieldComponent,
    resolvePreviewComponent,
    schema,
    unstable,
    value: documentValue,
  } = props

  const __internal: FormBuilderContextValue['__internal'] = useMemo(
    () => ({
      patchChannel, // eslint-disable-line camelcase
      components: {
        ArrayFunctions: unstable?.ArrayFunctions || DefaultArrayInputFunctions,
        CustomMarkers: unstable?.CustomMarkers || DefaultCustomMarkers,
        Markers: unstable?.Markers || DefaultMarkers,
      },
      file: {
        assetSources: file?.assetSources
          ? ensureArrayOfSources(file.assetSources) || defaultFileAssetSources
          : defaultFileAssetSources,
        directUploads: file?.directUploads !== false,
      },
      filterField: filterField || (() => true),
      image: {
        assetSources: image?.assetSources
          ? ensureArrayOfSources(image.assetSources) || defaultImageAssetSources
          : defaultFileAssetSources,
        directUploads: image?.directUploads !== false,
      },
      getDocument: () => documentValue,
      getValuePath: () => EMPTY_ARRAY,
      onChange,
      resolvePreviewComponent: (schemaType) => resolvePreviewComponent({schemaType}),
    }),
    [
      documentValue,
      file,
      filterField,
      image,
      onChange,
      patchChannel,
      resolvePreviewComponent,
      unstable,
    ]
  )

  const formBuilder: FormBuilderContextValue = useMemo(
    () => ({
      __internal,
      renderField: resolveFieldComponent,
      schema,
    }),
    [__internal, resolveFieldComponent, schema]
  )

  return <FormBuilderContext.Provider value={formBuilder}>{children}</FormBuilderContext.Provider>
}

function ensureArrayOfSources(sources: unknown): AssetSource[] | null {
  if (Array.isArray(sources)) {
    return sources
  }

  console.warn('Configured asset sources is not an array:', sources)

  return null
}
