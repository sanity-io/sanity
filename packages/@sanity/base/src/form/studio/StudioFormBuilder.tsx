/* eslint-disable react/jsx-handler-names */
import {ObjectSchemaType, Path, ValidationMarker} from '@sanity/types'
import React, {ComponentType, useCallback, useMemo, useRef} from 'react'

import {useSource} from '../../studio'
import {
  ObjectInputProps,
  RenderArrayOfObjectsItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
} from '../types'
import {PatchChannel} from '../patch/PatchChannel'
import {FormFieldPresence} from '../../presence'
import {FormPatch, PatchEvent} from '../patch'
import {ObjectMember} from '../store/types/members'
import {ObjectFormNode} from '../store/types/nodes'
import {EMPTY_ARRAY} from '../utils/empty'
import {StudioFormBuilderProvider} from './StudioFormBuilderProvider'
import {FormCallbacksProvider} from './contexts/FormCallbacks'
import {PresenceProvider} from './contexts/Presence'
import {ValidationProvider} from './contexts/Validation'

/**
 * @alpha
 */
export interface StudioFormBuilderProps extends ObjectFormNode {
  id: string
  focused: boolean | undefined
  changesOpen: boolean
  onPathBlur: (path: Path) => void
  onPathFocus: (path: Path) => void
  onSetCollapsedPath: (path: Path, collapsed: boolean) => void
  onSetCollapsedFieldSet: (path: Path, collapsed: boolean) => void
  onSelectFieldGroup: (path: Path, groupName: string) => void

  onPathOpen: (path: Path) => void

  focusPath: Path

  schemaType: ObjectSchemaType
  value: {[field in string]: unknown} | undefined
  onChange: (changeEvent: PatchEvent) => void
  /**
   * @internal Considered internal – do not use.
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  autoFocus?: boolean
  readOnly?: boolean
  presence: FormFieldPresence[]
  validation: ValidationMarker[]
  members: ObjectMember[]
}

/**
 * @alpha
 */
export function StudioFormBuilder(props: StudioFormBuilderProps) {
  const {
    __internal_patchChannel: patchChannel,
    // compareValue,
    focusPath,
    focused,
    id,
    presence,
    validation,
    onChange,
    onSelectFieldGroup,
    onPathFocus,
    onPathBlur,
    onSetCollapsedPath,
    onSetCollapsedFieldSet,
    onPathOpen,
    members,
    groups,
    readOnly,
    schemaType,
    value,
  } = props

  const {resolveFieldComponent, resolveInputComponent, resolveItemComponent} =
    useSource().formBuilder

  const handleBlur = useCallback(
    (event: React.FocusEvent) => {
      onPathBlur([])
    },
    [onPathBlur]
  )
  const handleFocus = useCallback(
    (event: React.FocusEvent) => {
      onPathFocus([])
    },
    [onPathFocus]
  )
  const handleSelectFieldGroup = useCallback(
    (groupName: string) => {
      onSelectFieldGroup([], groupName)
    },
    [onSelectFieldGroup]
  )

  const handleCollapse = useCallback(() => onSetCollapsedPath([], true), [onSetCollapsedPath])
  const handleExpand = useCallback(() => onSetCollapsedPath([], false), [onSetCollapsedPath])

  const handleCollapseField = useCallback(
    (fieldName: string) => onSetCollapsedPath([fieldName], true),
    [onSetCollapsedPath]
  )
  const handleExpandField = useCallback(
    (fieldName: string) => onSetCollapsedPath([fieldName], false),
    [onSetCollapsedPath]
  )
  const onOpenField = useCallback((fieldName: string) => onPathOpen([fieldName]), [onPathOpen])
  const onCloseField = useCallback((fieldName: string) => onPathOpen([]), [onPathOpen])

  const handleCollapseFieldSet = useCallback(
    (fieldSetName: string) => onSetCollapsedFieldSet([fieldSetName], true),
    [onSetCollapsedFieldSet]
  )
  const handleExpandFieldSet = useCallback(
    (fieldSetName: string) => onSetCollapsedFieldSet([fieldSetName], false),
    [onSetCollapsedFieldSet]
  )

  const handleChange = useCallback(
    (patch: FormPatch | FormPatch[] | PatchEvent) => {
      onChange(PatchEvent.from(patch))
    },
    [onChange]
  )

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

  const DocumentInput = useMemo(
    () => resolveInputComponent({schemaType}) as ComponentType<ObjectInputProps>,
    [resolveInputComponent, schemaType]
  )

  return (
    <StudioFormBuilderProvider
      __internal_patchChannel={patchChannel}
      onChange={props.onChange}
      value={value}
    >
      <FormCallbacksProvider
        onSetPathCollapsed={props.onSetCollapsedPath}
        onSetFieldSetCollapsed={props.onSetCollapsedFieldSet}
        onFieldGroupSelect={props.onSelectFieldGroup}
        onPathOpen={props.onPathOpen}
        onPathBlur={props.onPathBlur}
        onPathFocus={props.onPathFocus}
        onChange={props.onChange}
      >
        <PresenceProvider presence={presence}>
          <ValidationProvider validation={validation}>
            <DocumentInput
              compareValue={undefined}
              focusRef={useRef(null)}
              level={0}
              id={id}
              path={EMPTY_ARRAY}
              collapsed={false}
              focused={focused}
              focusPath={focusPath}
              onBlur={handleBlur}
              onChange={handleChange}
              validation={EMPTY_ARRAY}
              presence={EMPTY_ARRAY}
              onFocusPath={onPathFocus}
              onFocus={handleFocus}
              readOnly={readOnly}
              schemaType={schemaType}
              members={members}
              groups={groups}
              onSelectFieldGroup={handleSelectFieldGroup}
              onCollapse={handleCollapse}
              onExpand={handleExpand}
              onCollapseField={handleCollapseField}
              onExpandField={handleExpandField}
              onOpenField={onOpenField}
              onCloseField={onCloseField}
              onCollapseFieldSet={handleCollapseFieldSet}
              onExpandFieldSet={handleExpandFieldSet}
              value={value}
              renderInput={renderInput}
              renderField={renderField}
              renderItem={renderItem}
            />
          </ValidationProvider>
        </PresenceProvider>
      </FormCallbacksProvider>
    </StudioFormBuilderProvider>
  )
}
