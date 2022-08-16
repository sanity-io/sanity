/* eslint-disable camelcase */

import {ObjectSchemaType, Path, ValidationMarker} from '@sanity/types'
import React from 'react'
import {useSource} from '../../studio'
import {PatchChannel, PatchEvent} from '../patch'
import {FormBuilderProvider} from '../FormBuilderProvider'
import {ObjectMember, StateTree} from '../store'
import {FormFieldGroup} from '../types'
import {FormFieldPresence} from '../../presence'

/**
 * @alpha This API might change.
 */
export interface StudioFormBuilderProviderProps {
  /**
   * @internal Considered internal, do not use.
   */
  __internal_patchChannel: PatchChannel

  autoFocus?: boolean
  changesOpen?: boolean
  children?: React.ReactNode
  collapsedFieldSets: StateTree<boolean> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  focusPath: Path
  focused: boolean | undefined
  groups: FormFieldGroup[]
  id: string
  members: ObjectMember[]
  onChange: (changeEvent: PatchEvent) => void
  onPathBlur: (path: Path) => void
  onPathFocus: (path: Path) => void
  onPathOpen: (path: Path) => void
  onFieldGroupSelect: (path: Path, groupName: string) => void
  onSetPathCollapsed: (path: Path, collapsed: boolean) => void
  onSetFieldSetCollapsed: (path: Path, collapsed: boolean) => void
  presence: FormFieldPresence[]
  readOnly?: boolean
  schemaType: ObjectSchemaType
  validation: ValidationMarker[]
  value: {[field in string]: unknown} | undefined
}

/**
 * Default wiring for `FormBuilderProvider` when used with Sanity
 *
 * @alpha This API might change.
 */
export function StudioFormBuilderProvider(props: StudioFormBuilderProviderProps) {
  const {
    __internal_patchChannel: patchChannel,
    autoFocus,
    changesOpen,
    children,
    collapsedFieldSets,
    collapsedPaths,
    focusPath,
    focused,
    groups,
    id,
    members,
    onChange,
    onPathBlur,
    onPathFocus,
    onPathOpen,
    onFieldGroupSelect,
    onSetPathCollapsed,
    onSetFieldSetCollapsed,
    presence,
    readOnly,
    schemaType,
    validation,
    value,
  } = props

  const {file, image, renderField, renderInput, renderItem, renderPreview} = useSource().form

  return (
    <FormBuilderProvider
      __internal_patchChannel={patchChannel}
      autoFocus={autoFocus}
      changesOpen={changesOpen}
      collapsedFieldSets={collapsedFieldSets}
      collapsedPaths={collapsedPaths}
      file={file}
      focusPath={focusPath}
      focused={focused}
      groups={groups}
      id={id}
      image={image}
      members={members}
      onChange={onChange}
      onPathBlur={onPathBlur}
      onPathFocus={onPathFocus}
      onPathOpen={onPathOpen}
      onFieldGroupSelect={onFieldGroupSelect}
      onSetPathCollapsed={onSetPathCollapsed}
      onSetFieldSetCollapsed={onSetFieldSetCollapsed}
      presence={presence}
      readOnly={readOnly}
      renderField={renderField}
      renderInput={renderInput}
      renderItem={renderItem}
      renderPreview={renderPreview}
      schemaType={schemaType}
      validation={validation}
      value={value}
    >
      {children}
    </FormBuilderProvider>
  )
}
