import {ObjectSchemaType, Path, ValidationMarker} from '@sanity/types'
import React, {useCallback} from 'react'
import {useSource} from '../../studio'
import {PatchChannel, PatchEvent} from '../patch'
import {FormBuilderProvider} from '../FormBuilderProvider'
import {
  FormFieldGroup,
  ObjectMember,
  RenderArrayOfObjectsItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
} from '../types'
import {FormFieldPresence} from '../../presence'

/**
 * @alpha This API might change.
 */
export interface StudioFormBuilderProviderProps {
  /**
   * @internal Considered internal, do not use.
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  autoFocus?: boolean
  changesOpen: boolean
  children: React.ReactElement
  compareValue: {[field in string]: unknown} | undefined
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
  onSetFieldSetCollapsed: (path: Path, collapsed: boolean) => void
  onSetPathCollapsed: (path: Path, collapsed: boolean) => void
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
    compareValue,
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
    onSetFieldSetCollapsed,
    onSetPathCollapsed,
    presence,
    readOnly,
    schemaType,
    validation,
    value,
  } = props

  const {formBuilder} = useSource()

  const {resolveFieldComponent, resolveInputComponent, resolveItemComponent} = formBuilder

  const renderInput: RenderInputCallback = useCallback(
    (inputProps) => {
      const Input = resolveInputComponent({schemaType: inputProps.schemaType})
      return <Input {...inputProps} />
    },
    [resolveInputComponent]
  )

  const renderField: RenderFieldCallback = useCallback(
    (field) => {
      const Field = resolveFieldComponent({schemaType: field.schemaType})
      return <Field {...field} />
    },
    [resolveFieldComponent]
  )

  const renderItem: RenderArrayOfObjectsItemCallback = useCallback(
    (item) => {
      const Item = resolveItemComponent({schemaType: item.schemaType})
      return <Item {...item} />
    },
    [resolveItemComponent]
  )

  return (
    <FormBuilderProvider
      __internal_patchChannel={patchChannel}
      __internal_resolveInputComponent={resolveInputComponent}
      autoFocus={autoFocus}
      changesOpen={changesOpen}
      compareValue={compareValue}
      focusPath={focusPath}
      focused={focused}
      groups={groups}
      id={id}
      members={members}
      onChange={onChange}
      onPathBlur={onPathBlur}
      onPathFocus={onPathFocus}
      onPathOpen={onPathOpen}
      onFieldGroupSelect={onFieldGroupSelect}
      onSetFieldSetCollapsed={onSetFieldSetCollapsed}
      onSetPathCollapsed={onSetPathCollapsed}
      presence={presence}
      readOnly={readOnly}
      renderField={renderField}
      renderInput={renderInput}
      renderItem={renderItem}
      schemaType={schemaType}
      validation={validation}
      value={value}
      {...formBuilder}
    >
      {children}
    </FormBuilderProvider>
  )
}
