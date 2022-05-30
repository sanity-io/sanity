/* eslint-disable camelcase */

import {AssetSource, ObjectSchemaType, Path, SchemaType, ValidationMarker} from '@sanity/types'
import React, {useEffect, useMemo, useRef} from 'react'
import {Source} from '../config'
import {FormFieldPresence} from '../presence'
import {FormBuilderContext, FormBuilderContextValue} from './FormBuilderContext'
import {
  FIXME,
  FormBuilderFilterFieldFn,
  FormFieldGroup,
  InputProps,
  ObjectMember,
  RenderArrayOfObjectsItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
} from './types'
import {DefaultArrayInputFunctions} from './inputs/arrays/common/ArrayFunctions'
import {DefaultMarkers} from './inputs/PortableText/_legacyDefaultParts/Markers'
import {DefaultCustomMarkers} from './inputs/PortableText/_legacyDefaultParts/CustomMarkers'
import {PatchChannel, PatchEvent} from './patch'
import {FormCallbacksProvider} from './studio/contexts/FormCallbacks'
import {PresenceProvider} from './studio/contexts/Presence'
import {ValidationProvider} from './studio/contexts/Validation'
import {defaultFileAssetSources, defaultImageAssetSources} from './defaults'

type SourceFormBuilder = Source['formBuilder']

export interface FormBuilderProviderProps extends SourceFormBuilder {
  /**
   * @internal
   */
  __internal_patchChannel?: PatchChannel // eslint-disable-line camelcase
  /**
   * @internal
   */
  __internal_resolveInputComponent: (options: {
    schemaType: SchemaType
  }) => React.ComponentType<InputProps>
  autoFocus?: boolean
  changesOpen?: boolean
  children?: React.ReactNode
  compareValue: {[field in string]: unknown} | undefined
  filterField?: FormBuilderFilterFieldFn
  focusPath: Path
  focused?: boolean
  groups: FormFieldGroup[]
  id: string
  members: ObjectMember[]
  onChange: (event: PatchEvent) => void
  onPathBlur: (path: Path) => void
  onPathFocus: (path: Path) => void
  onPathOpen: (path: Path) => void
  onFieldGroupSelect: (path: Path, groupName: string) => void
  onSetFieldSetCollapsed: (path: Path, collapsed: boolean) => void
  onSetPathCollapsed: (path: Path, collapsed: boolean) => void
  presence: FormFieldPresence[]
  readOnly?: boolean
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  schemaType: ObjectSchemaType
  validation: ValidationMarker[]
  value: {[field in string]: unknown} | undefined
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
    __internal_resolveInputComponent: resolveInputComponent,
    autoFocus,
    changesOpen,
    children,
    compareValue,
    file,
    filterField,
    focusPath,
    focused,
    groups,
    id,
    image,
    members,
    onChange,
    onFieldGroupSelect,
    onPathBlur,
    onPathFocus,
    onPathOpen,
    onSetFieldSetCollapsed,
    onSetPathCollapsed,
    presence,
    readOnly,
    renderField,
    renderInput,
    renderItem,
    resolvePreviewComponent,
    schemaType,
    unstable,
    validation,
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
          : defaultImageAssetSources,
        directUploads: image?.directUploads !== false,
      },
      getDocument: () => documentValueRef.current as FIXME,
      onChange,
      resolveInputComponent,
      resolvePreviewComponent: (_schemaType) => resolvePreviewComponent({schemaType: _schemaType}),
    }),
    [
      file,
      filterField,
      image,
      onChange,
      patchChannel,
      resolveInputComponent,
      resolvePreviewComponent,
      unstable,
    ]
  )

  const formBuilder: FormBuilderContextValue = useMemo(
    () => ({
      __internal,
      autoFocus,
      changesOpen,
      compareValue,
      focusPath,
      focused,
      groups,
      id,
      members,
      readOnly,
      renderField,
      renderInput,
      renderItem,
      schemaType,
      value: documentValue,
    }),
    [
      __internal,
      autoFocus,
      changesOpen,
      compareValue,
      documentValue,
      focusPath,
      focused,
      groups,
      id,
      members,
      readOnly,
      renderField,
      renderInput,
      renderItem,
      schemaType,
    ]
  )

  return (
    <FormBuilderContext.Provider value={formBuilder}>
      <FormCallbacksProvider
        onChange={onChange}
        onFieldGroupSelect={onFieldGroupSelect}
        onPathBlur={onPathBlur}
        onPathFocus={onPathFocus}
        onPathOpen={onPathOpen}
        onSetPathCollapsed={onSetPathCollapsed}
        onSetFieldSetCollapsed={onSetFieldSetCollapsed}
      >
        <PresenceProvider presence={presence}>
          <ValidationProvider validation={validation}>{children}</ValidationProvider>
        </PresenceProvider>
      </FormCallbacksProvider>
    </FormBuilderContext.Provider>
  )
}

function _ensureArrayOfSources(sources: unknown): AssetSource[] | null {
  if (Array.isArray(sources)) {
    return sources
  }

  console.warn('Configured asset sources is not an array:', sources)

  return null
}
