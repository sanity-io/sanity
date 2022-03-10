import React, {useMemo} from 'react'
import {AssetSource, Schema, SchemaType, ValidationMarker} from '@sanity/types'
import {fallbackInputs} from './fallbackInputs'
import {FormBuilderContext, FormBuilderContextValue} from './FormBuilderContext'
import {PortableTextMarker, RenderCustomMarkers} from './inputs/PortableText/types'
import {PatchChannel} from './patchChannel'
import {
  FormBuilderFilterFieldFn,
  FormInputComponentResolver,
  FormPreviewComponentResolver,
  FormInputProps,
  FormArrayInputFunctionsProps,
} from './types'
import {DefaultArrayInputFunctions} from './inputs/arrays/common/ArrayFunctions'
import {DefaultMarkers} from './inputs/PortableText/_legacyDefaultParts/Markers'
import {DefaultCustomMarkers} from './inputs/PortableText/_legacyDefaultParts/CustomMarkers'
import {FileSource, ImageSource} from './sanity/DefaultAssetSource'

const defaultFileAssetSources = [FileSource]
const defaultImageAssetSources = [ImageSource]

const EMPTY_ARRAY = []

function resolveComponentFromType<Props>(
  providedResolve:
    | ((type: SchemaType) => React.ComponentType<Props> | null | false | undefined)
    | undefined,
  type: SchemaType
) {
  let itType = type

  while (itType) {
    const resolved = providedResolve?.(itType)

    if (resolved) return resolved

    itType = itType.type
  }

  return undefined
}

export interface FormBuilderProviderProps {
  components?: {
    ArrayFunctions?: React.ComponentType<FormArrayInputFunctionsProps<any, any>>
    CustomMarkers?: React.ComponentType<{markers: PortableTextMarker[]}>
    Markers: React.ComponentType<{
      markers: PortableTextMarker[]
      renderCustomMarkers: RenderCustomMarkers
      validation: ValidationMarker[]
    }>
    inputs?: Record<string, React.ComponentType<FormInputProps<any, any>> | undefined>
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
  filterField?: FormBuilderFilterFieldFn
  /**
   * @internal
   */
  __internal_patchChannel?: PatchChannel // eslint-disable-line camelcase
  resolveInputComponent: FormInputComponentResolver
  resolvePreviewComponent: FormPreviewComponentResolver
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
        ArrayFunctions: components?.ArrayFunctions || DefaultArrayInputFunctions,
        CustomMarkers: components?.CustomMarkers || DefaultCustomMarkers,
        Markers: components?.Markers || DefaultMarkers,
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
        resolveComponentFromType(resolveInputComponentProp, type) || fallbackInputs[type.jsonType],
      resolvePreviewComponent: (type) =>
        resolveComponentFromType(resolvePreviewComponentProp, type),
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
