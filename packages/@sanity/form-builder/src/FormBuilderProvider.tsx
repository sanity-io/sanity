import React, {useMemo} from 'react'
import {AssetSource, Schema, SchemaType} from '@sanity/types'
import {fallbackInputs} from './fallbackInputs'
import {FormBuilderContext, FormBuilderContextValue} from './FormBuilderContext'
import DefaultArrayFunctions from './sanity/legacyPartImplementations/array-functions-default'
import BlockMarkersDefault from './sanity/legacyPartImplementations/block-markers-default'
import fileAssetSourceDefault from './sanity/legacyPartImplementations/file-asset-source-default'
import imageAssetSourceDefault from './sanity/legacyPartImplementations/image-asset-source-default'
import {PatchChannel} from './patchChannel'

const defaultFileAssetSources = [fileAssetSourceDefault]
const defaultImageAssetSources = [imageAssetSourceDefault]

const EMPTY_ARRAY = []

const RESOLVE_NULL = (..._: unknown[]) => null

function resolve(
  providedResolve: FormBuilderContextValue['resolveInputComponent'] = RESOLVE_NULL,
  type: SchemaType
) {
  let itType = type

  while (itType) {
    const resolved = providedResolve(itType)
    if (resolved) {
      return resolved
    }
    itType = itType.type
  }

  return undefined
}

export interface FormBuilderProviderProps {
  components?: {
    ArrayFunctions?: React.ComponentType<any>
    CustomMarkers?: React.ComponentType<any>
    Markers?: React.ComponentType<any>
    inputs?: {
      object?: React.ComponentType<any>
      boolean?: React.ComponentType<any>
      number?: React.ComponentType<any>
      string?: React.ComponentType<any>
      text?: React.ComponentType<any>
      reference?: React.ComponentType<any>
      datetime?: React.ComponentType<any>
      email?: React.ComponentType<any>
      geopoint?: React.ComponentType<any>
      url?: React.ComponentType<any>
    }
  }
  file?: {
    assetSources?: AssetSource[]
    directUploads?: boolean
  }
  image?: {
    assetSources?: AssetSource[]
    directUploads?: boolean
  }
  schema: Schema
  value?: unknown
  children?: React.ReactNode
  filterField?: any
  /**
   * @internal
   */
  __internal_patchChannel?: PatchChannel // eslint-disable-line camelcase
  resolveInputComponent: (type: SchemaType) => React.ComponentType<any> | undefined
  resolvePreviewComponent: (type: SchemaType) => React.ComponentType<any> | undefined
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

export default function FormBuilderProvider(props: FormBuilderProviderProps) {
  const {
    children,
    components,
    file,
    image,
    schema,
    filterField,
    __internal_patchChannel: patchChannel = missingPatchChannel,
    resolveInputComponent: resolveInputComponentProp,
    resolvePreviewComponent: resolvePreviewComponentProp,
    value,
  } = props

  const formBuilder: FormBuilderContextValue = useMemo(() => {
    return {
      components: {
        ArrayFunctions: components?.ArrayFunctions || DefaultArrayFunctions,
        CustomMarkers: components?.CustomMarkers,
        Markers: components?.Markers || BlockMarkersDefault,
        inputs: components?.inputs || {},
      },
      file: {
        assetSources: file?.assetSources
          ? ensureArrayOfSources(file.assetSources) || defaultFileAssetSources
          : defaultFileAssetSources,
        directUploads: file?.directUploads !== false,
      },
      filterField,
      image: {
        assetSources: image?.assetSources
          ? ensureArrayOfSources(image.assetSources) || defaultImageAssetSources
          : defaultFileAssetSources,
        directUploads: image?.directUploads !== false,
      },
      getValuePath: () => EMPTY_ARRAY,
      __internal_patchChannel: patchChannel, // eslint-disable-line camelcase
      schema,
      resolveInputComponent: (type) =>
        resolve(resolveInputComponentProp, type) || fallbackInputs[type.jsonType],
      resolvePreviewComponent: (type) => resolve(resolvePreviewComponentProp, type),
      getDocument: () => value,
    }
  }, [
    components,
    file,
    filterField,
    image,
    patchChannel,
    resolveInputComponentProp,
    resolvePreviewComponentProp,
    schema,
    value,
  ])

  return <FormBuilderContext.Provider value={formBuilder}>{children}</FormBuilderContext.Provider>
}

function ensureArrayOfSources(sources: unknown): AssetSource[] {
  if (Array.isArray(sources)) {
    return sources
  }

  console.warn('Configured asset sources is not an array:', sources)

  return null
}
