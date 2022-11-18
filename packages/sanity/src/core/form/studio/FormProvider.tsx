/* eslint-disable camelcase */
import {ObjectSchemaType, Path, ValidationMarker} from '@sanity/types'
import React, {useCallback} from 'react'
import {useSource} from '../../studio'
import {PatchChannel, PatchEvent} from '../patch'
import {FormBuilderProvider} from '../FormBuilderProvider'
import {FormFieldGroup, ObjectMember, StateTree} from '../store'
import {FieldProps, InputProps, ItemProps, RenderPreviewCallbackProps} from '../types'
import {
  useFieldComponent,
  useInputComponent,
  useItemComponent,
  usePreviewComponent,
} from '../form-components-hooks'
import {PreviewProps} from '../../components'
import {FormNodePresence} from '../../presence'

/**
 * @alpha This API might change.
 */
export interface FormProviderProps {
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
  presence: FormNodePresence[]
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
export function FormProvider(props: FormProviderProps) {
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

  const {file, image} = useSource().form

  // These hooks may be stored in context as an perf optimization
  const Input = useInputComponent()
  const Field = useFieldComponent()
  const Preview = usePreviewComponent()
  const Item = useItemComponent()

  const renderInput = useCallback(
    (inputProps: Omit<InputProps, 'renderDefault'>) => <Input {...inputProps} />,
    [Input]
  )
  const renderField = useCallback(
    (fieldProps: Omit<FieldProps, 'renderDefault'>) => <Field {...fieldProps} />,
    [Field]
  )
  const renderItem = useCallback(
    (itemProps: Omit<ItemProps, 'renderDefault'>) => <Item {...itemProps} />,
    [Item]
  )
  const renderPreview = useCallback(
    (previewProps: Omit<RenderPreviewCallbackProps, 'renderDefault'>) => (
      <Preview {...previewProps} />
    ),
    [Preview]
  )

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
