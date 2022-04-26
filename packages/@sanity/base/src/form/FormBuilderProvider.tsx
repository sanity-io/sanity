import {AssetSource, Path, Schema, SchemaType} from '@sanity/types'
import React, {useMemo} from 'react'
import {SanityFormBuilderConfig} from '../config'
import {FIXME, FormBuilderFilterFieldFn, RenderFieldCallback} from './types'
import {fallbackInputs} from './fallbackInputs'
import {FormBuilderContext, FormBuilderContextValue} from './FormBuilderContext'
import {PatchChannel} from './patch/PatchChannel'
import {DefaultArrayInputFunctions} from './inputs/arrays/common/ArrayFunctions'
import {DefaultMarkers} from './inputs/PortableText/_legacyDefaultParts/Markers'
import {DefaultCustomMarkers} from './inputs/PortableText/_legacyDefaultParts/CustomMarkers'
import {FileSource, ImageSource} from './studio/DefaultAssetSource'
import {EMPTY_ARRAY} from './utils/empty'
import {PatchArg} from './patch'

const defaultFileAssetSources = [FileSource]
const defaultImageAssetSources = [ImageSource]

function resolveComponentFromType<Props>(
  providedResolve:
    | ((type: SchemaType) => React.ComponentType<Props> | null | false | undefined)
    | undefined,
  type: SchemaType
) {
  let itType: SchemaType | undefined = type

  while (itType) {
    const resolved = providedResolve?.(itType)

    if (resolved) return resolved

    itType = itType.type
  }

  return undefined
}

export interface FormBuilderProviderProps extends SanityFormBuilderConfig {
  schema: Schema
  value?: unknown
  children?: React.ReactNode
  filterField?: FormBuilderFilterFieldFn
  /**
   * @internal
   */
  __internal_patchChannel?: PatchChannel // eslint-disable-line camelcase
  onBlur?: () => void
  onChange?: (path: Path, ...patches: PatchArg[]) => void
  onFocus?: (path: Path) => void
  onSelectFieldGroup?: (path: Path, groupName: string) => void
  onSetCollapsed?: (path: Path, collapsed: boolean) => void
  renderField: RenderFieldCallback
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

const noop = () => undefined

export function FormBuilderProvider(props: FormBuilderProviderProps) {
  const {
    children,
    components,
    file,
    image,
    schema,
    filterField,
    __internal_patchChannel: patchChannel = missingPatchChannel,
    onBlur = noop,
    onChange = noop,
    onFocus = noop,
    onSelectFieldGroup = noop,
    onSetCollapsed = noop,
    renderField,
    resolveInputComponent: resolveInputComponentProp,
    resolvePreviewComponent: resolvePreviewComponentProp,
    value,
  } = props

  const formBuilder: FormBuilderContextValue = useMemo(() => {
    return {
      __internal_patchChannel: patchChannel, // eslint-disable-line camelcase

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

      filterField: filterField || (() => true),

      image: {
        assetSources: image?.assetSources
          ? ensureArrayOfSources(image.assetSources) || defaultImageAssetSources
          : defaultFileAssetSources,
        directUploads: image?.directUploads !== false,
      },

      getValuePath: () => EMPTY_ARRAY,

      onBlur,
      onChange,
      onFocus,
      onSelectFieldGroup,
      onSetCollapsed,

      schema,

      renderField,

      resolveInputComponent: (type) => {
        const resolved = resolveComponentFromType(resolveInputComponentProp, type)

        if (resolved) {
          return resolved
        }

        return fallbackInputs[type.jsonType]?.input as FIXME
      },

      resolvePreviewComponent: (type) =>
        resolveComponentFromType(resolvePreviewComponentProp, type),
      getDocument: () => value,
    }
  }, [
    components,
    file,
    filterField,
    image,
    onBlur,
    onChange,
    onFocus,
    onSelectFieldGroup,
    onSetCollapsed,
    patchChannel,
    renderField,
    resolveInputComponentProp,
    resolvePreviewComponentProp,
    schema,
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
