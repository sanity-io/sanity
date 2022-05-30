import {ObjectSchemaType, Path, ValidationMarker} from '@sanity/types'
import React, {ComponentType, useCallback, useMemo, useRef} from 'react'
import {FormFieldPresence} from '../../presence'
import {FormPatch, PatchChannel, PatchEvent} from '../patch'
import {ObjectMember} from '../store/types/members'
import {ObjectFormNode} from '../store/types/nodes'
import {ObjectInputProps} from '../types'
import {useFormBuilder} from '../useFormBuilder'
import {EMPTY_ARRAY} from '../utils/empty'
import {StudioFormBuilderProvider} from './StudioFormBuilderProvider'
import {useFormCallbacks} from './contexts/FormCallbacks'

/**
 * @alpha
 */
export interface StudioFormBuilderProps extends ObjectFormNode {
  /**
   * @internal Considered internal – do not use.
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  autoFocus?: boolean
  changesOpen: boolean
  focusPath: Path
  focused: boolean | undefined
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
 * @alpha
 */
export function StudioFormBuilder(props: StudioFormBuilderProps) {
  const {
    __internal_patchChannel: patchChannel,
    autoFocus,
    changesOpen,
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

  return (
    <StudioFormBuilderProvider
      __internal_patchChannel={patchChannel}
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
      schemaType={schemaType}
      validation={validation}
      value={value}
    >
      <RootInput />
    </StudioFormBuilderProvider>
  )
}

function RootInput() {
  const {
    __internal,
    compareValue,
    focused,
    focusPath,
    groups,
    id,
    members,
    readOnly,
    schemaType,
    value,
    renderInput,
    renderField,
    renderItem,
  } = useFormBuilder()

  const {resolveInputComponent} = __internal

  const {
    onChange,
    onPathBlur,
    onPathFocus,
    onPathOpen,
    onFieldGroupSelect,
    onSetFieldSetCollapsed,
    onSetPathCollapsed,
  } = useFormCallbacks()

  const handleBlur = useCallback(() => onPathBlur(EMPTY_ARRAY), [onPathBlur])

  const handleFocus = useCallback(() => onPathFocus(EMPTY_ARRAY), [onPathFocus])

  const DocumentInput = useMemo(
    () => resolveInputComponent({schemaType}) as ComponentType<ObjectInputProps>,
    [resolveInputComponent, schemaType]
  )

  const handleChange = useCallback(
    (patch: FormPatch | FormPatch[] | PatchEvent) => onChange(PatchEvent.from(patch)),
    [onChange]
  )

  const handleSelectFieldGroup = useCallback(
    (groupName: string) => onFieldGroupSelect(EMPTY_ARRAY, groupName),
    [onFieldGroupSelect]
  )

  const handleCollapse = useCallback(() => onSetPathCollapsed([], true), [onSetPathCollapsed])
  const handleExpand = useCallback(() => onSetPathCollapsed([], false), [onSetPathCollapsed])

  const handleCollapseField = useCallback(
    (fieldName: string) => onSetPathCollapsed([fieldName], true),
    [onSetPathCollapsed]
  )
  const handleExpandField = useCallback(
    (fieldName: string) => onSetPathCollapsed([fieldName], false),
    [onSetPathCollapsed]
  )
  const handleOpenField = useCallback((fieldName: string) => onPathOpen([fieldName]), [onPathOpen])
  const handleCloseField = useCallback(() => onPathOpen([]), [onPathOpen])

  const handleCollapseFieldSet = useCallback(
    (fieldSetName: string) => onSetFieldSetCollapsed([fieldSetName], true),
    [onSetFieldSetCollapsed]
  )
  const handleExpandFieldSet = useCallback(
    (fieldSetName: string) => onSetFieldSetCollapsed([fieldSetName], false),
    [onSetFieldSetCollapsed]
  )

  return (
    <DocumentInput
      compareValue={compareValue}
      focusRef={useRef(null)}
      level={0}
      id={id}
      path={EMPTY_ARRAY}
      collapsed={false}
      focused={focused}
      focusPath={focusPath}
      onBlur={handleBlur}
      onChange={handleChange}
      onCloseField={handleCloseField}
      onCollapse={handleCollapse}
      onCollapseField={handleCollapseField}
      onCollapseFieldSet={handleCollapseFieldSet}
      onExpand={handleExpand}
      onExpandField={handleExpandField}
      onExpandFieldSet={handleExpandFieldSet}
      onOpenField={handleOpenField}
      onSelectFieldGroup={handleSelectFieldGroup}
      validation={EMPTY_ARRAY}
      presence={EMPTY_ARRAY}
      onFocusPath={onPathFocus}
      onFocus={handleFocus}
      readOnly={readOnly}
      schemaType={schemaType}
      members={members}
      groups={groups}
      // onFieldGroupSelect={handleSelectFieldGroup}
      // onSetCollapsed={handleSetCollapsed}
      // onSetFieldCollapsed={handleSetFieldCollapsed}
      // onSetFieldSetCollapsed={handleSetFieldSetCollapsed}
      value={value}
      renderInput={renderInput}
      renderField={renderField}
      renderItem={renderItem}
    />
  )
}
