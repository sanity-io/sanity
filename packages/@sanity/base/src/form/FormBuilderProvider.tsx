import {AssetSource} from '@sanity/types'
import React, {useEffect, useMemo, useRef} from 'react'
import {Source} from '../config'
import {FIXME, FormBuilderFilterFieldFn} from './types'
import {FormBuilderContext, FormBuilderContextValue} from './FormBuilderContext'
import {PatchChannel} from './patch/PatchChannel'
import {DefaultArrayInputFunctions} from './inputs/arrays/common/ArrayFunctions'
import {DefaultMarkers} from './inputs/PortableText/_legacyDefaultParts/Markers'
import {DefaultCustomMarkers} from './inputs/PortableText/_legacyDefaultParts/CustomMarkers'
import {FileSource, ImageSource} from './studio/DefaultAssetSource'
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
    resolvePreviewComponent,
    unstable,
    value: documentValue,
  } = props

  const documentValueRef = useRef(documentValue)

  useEffect(() => {
    documentValueRef.current = documentValue
  }, [documentValue])

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
          ? _ensureArrayOfSources(file.assetSources) || defaultFileAssetSources
          : defaultFileAssetSources,
        directUploads: file?.directUploads !== false,
      },
      filterField: filterField || (() => true),
      image: {
        assetSources: image?.assetSources
          ? _ensureArrayOfSources(image.assetSources) || defaultImageAssetSources
          : defaultFileAssetSources,
        directUploads: image?.directUploads !== false,
      },
      getDocument: () => documentValueRef.current,
      onChange,
      resolvePreviewComponent: (schemaType) => resolvePreviewComponent({schemaType}),
    }),
    [file, filterField, image, onChange, patchChannel, resolvePreviewComponent, unstable]
  )

  const formBuilder: FormBuilderContextValue = useMemo(() => ({__internal}), [__internal])

  return <FormBuilderContext.Provider value={formBuilder}>{children}</FormBuilderContext.Provider>
}

function _ensureArrayOfSources(sources: unknown): AssetSource[] | null {
  if (Array.isArray(sources)) {
    return sources
  }

  console.warn('Configured asset sources is not an array:', sources)

  return null
}
