import {AssetSource, Schema} from '@sanity/types'
import React, {useMemo} from 'react'
import {Source} from '../config'
import {FormBuilderFilterFieldFn} from './types'
import {FormBuilderContext, FormBuilderContextValue} from './FormBuilderContext'
import {PatchChannel} from './patch/PatchChannel'
import {DefaultArrayInputFunctions} from './inputs/arrays/common/ArrayFunctions'
import {DefaultMarkers} from './inputs/PortableText/_legacyDefaultParts/Markers'
import {DefaultCustomMarkers} from './inputs/PortableText/_legacyDefaultParts/CustomMarkers'
import {FileSource, ImageSource} from './studio/DefaultAssetSource'
import {EMPTY_ARRAY} from './utils/empty'

const defaultFileAssetSources = [FileSource]
const defaultImageAssetSources = [ImageSource]

type SourceFormBuilder = Source['formBuilder']
export interface FormBuilderProviderProps extends SourceFormBuilder {
  schema: Schema
  value?: unknown
  children?: React.ReactNode
  filterField?: FormBuilderFilterFieldFn
  /**
   * @internal
   */
  __internal_patchChannel?: PatchChannel // eslint-disable-line camelcase
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
    children,
    schema,
    filterField,
    __internal_patchChannel: patchChannel = missingPatchChannel,
    file,
    image,
    resolveFieldComponent,
    resolvePreviewComponent,
    unstable,
    value,
  } = props

  const formBuilder: FormBuilderContextValue = useMemo(() => {
    return {
      components: {
        ArrayFunctions: unstable?.ArrayFunctions || DefaultArrayInputFunctions,
        CustomMarkers: unstable?.CustomMarkers || DefaultCustomMarkers,
        Markers: unstable?.Markers || DefaultMarkers,
      },

      renderField: resolveFieldComponent,

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

      getValuePath: () => EMPTY_ARRAY,
      __internal_patchChannel: patchChannel, // eslint-disable-line camelcase
      schema,

      resolvePreviewComponent: (schemaType) => resolvePreviewComponent({schemaType}),
      getDocument: () => value,
    }
  }, [
    file,
    filterField,
    image,
    patchChannel,
    resolveFieldComponent,
    resolvePreviewComponent,
    schema,
    unstable,
    value,
  ])

  return <FormBuilderContext.Provider value={formBuilder}>{children}</FormBuilderContext.Provider>
}

function ensureArrayOfSources(sources: unknown): AssetSource[] | null {
  if (Array.isArray(sources)) {
    return sources
  }

  console.warn('Configured asset sources is not an array:', sources)

  return null
}
