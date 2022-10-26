/* eslint-disable camelcase */

import {ObjectSchemaType, Path, ValidationMarker} from '@sanity/types'
import React, {useEffect, useMemo, useRef} from 'react'
import {Source} from '../config'
import {FormNodePresence} from '../presence'
import {FIXME} from '../FIXME'
import {FormBuilderContext, FormBuilderContextValue} from './FormBuilderContext'
import {
  FormBuilderFilterFieldFn,
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
  RenderPreviewCallback,
} from './types'
import {FormFieldGroup, ObjectMember, StateTree} from './store'
import {ArrayOfObjectsFunctions} from './inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsFunctions'
import {DefaultMarkers} from './inputs/PortableText/_legacyDefaultParts/Markers'
import {DefaultCustomMarkers} from './inputs/PortableText/_legacyDefaultParts/CustomMarkers'
import {PatchChannel, PatchEvent} from './patch'
import {FormCallbacksProvider} from './studio/contexts/FormCallbacks'
import {PresenceProvider} from './studio/contexts/Presence'
import {ValidationProvider} from './studio/contexts/Validation'

export interface FormBuilderProviderProps {
  /**
   * @internal
   */
  __internal_patchChannel?: PatchChannel // eslint-disable-line camelcase
  autoFocus?: boolean
  changesOpen?: boolean
  children?: React.ReactNode
  collapsedFieldSets: StateTree<boolean> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  file: Source['form']['file']
  filterField?: FormBuilderFilterFieldFn
  focusPath: Path
  focused?: boolean
  groups: FormFieldGroup[]
  id: string
  image: Source['form']['image']
  members: ObjectMember[]
  onChange: (event: PatchEvent) => void
  onFieldGroupSelect: (path: Path, groupName: string) => void
  onPathBlur: (path: Path) => void
  onPathFocus: (path: Path) => void
  onPathOpen: (path: Path) => void
  onSetFieldSetCollapsed: (path: Path, collapsed: boolean) => void
  onSetPathCollapsed: (path: Path, collapsed: boolean) => void
  presence: FormNodePresence[]
  readOnly?: boolean
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderItemCallback
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  unstable?: Source['form']['unstable']
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
    autoFocus,
    changesOpen,
    children,
    collapsedFieldSets,
    collapsedPaths,
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
    renderPreview,
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
        ArrayFunctions: ArrayOfObjectsFunctions,
        CustomMarkers: unstable?.CustomMarkers || DefaultCustomMarkers,
        Markers: unstable?.Markers || DefaultMarkers,
      },
      file: {
        assetSources: file.assetSources,
        directUploads: file?.directUploads !== false,
      },
      filterField: filterField || (() => true),
      image: {
        assetSources: image.assetSources,
        directUploads: image?.directUploads !== false,
      },
      getDocument: () => documentValueRef.current as FIXME,
      onChange,
    }),
    [file, filterField, image, onChange, patchChannel, unstable]
  )

  const formBuilder: FormBuilderContextValue = useMemo(
    () => ({
      __internal,
      autoFocus,
      changesOpen,
      collapsedFieldSets,
      collapsedPaths,
      focusPath,
      focused,
      groups,
      id,
      members,
      readOnly,
      renderField,
      renderInput,
      renderItem,
      renderPreview,
      schemaType,
      value: documentValue,
    }),
    [
      __internal,
      autoFocus,
      changesOpen,
      collapsedFieldSets,
      collapsedPaths,
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
      renderPreview,
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
