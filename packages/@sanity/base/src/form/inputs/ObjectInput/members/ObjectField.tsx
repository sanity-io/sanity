import React, {useCallback, useMemo, useRef} from 'react'
import {Path} from '@sanity/types'
import {FieldMember} from '../../../store/types/members'
import {ObjectFormNode} from '../../../store/types/nodes'
import {
  ObjectInputProps,
  RenderArrayOfObjectsItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
} from '../../../types'
import {FormCallbacksProvider, useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {PatchArg, PatchEvent, setIfMissing} from '../../../patch'
import {createProtoValue} from '../../../utils/createProtoValue'
import {ObjectFieldProps} from '../../../types/fieldProps'
import {EMPTY_ARRAY} from '../../../utils/empty'

/**
 * Responsible for creating inputProps and fieldProps to pass to ´renderInput´ and ´renderField´ for an object input
 * Note: "ObjectField" in this context means an object field of an object type (not "a field of an object")
 * @param props - Component props
 */
export const ObjectField = function ObjectField(props: {
  member: FieldMember<ObjectFormNode>
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
}) {
  const {
    onPathBlur,
    onPathFocus,
    onChange,
    onSetCollapsedPath,
    onSetCollapsedFieldSet,
    onSelectFieldGroup,
  } = useFormCallbacks()
  const {member, renderField, renderInput, renderItem} = props
  const focusRef = useRef<{focus: () => void}>()

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  const handleBlur = useCallback(
    (event: React.FocusEvent) => {
      onPathBlur(member.field.path)
    },
    [member.field.path, onPathBlur]
  )

  const handleFocus = useCallback(
    (event: React.FocusEvent) => {
      onPathFocus(member.field.path)
    },
    [member.field.path, onPathFocus]
  )

  const handleFocusChildPath = useCallback(
    (path: Path) => {
      onPathFocus(member.field.path.concat(path))
    },
    [member.field.path, onPathFocus]
  )

  const handleChange = useCallback(
    (event: PatchEvent | PatchArg) => {
      onChange(
        PatchEvent.from(event)
          .prepend(setIfMissing(createProtoValue(member.field.schemaType)))
          .prefixAll(member.name)
      )
    },
    [onChange, member.field.schemaType, member.name]
  )

  const handleSetCollapsed = useCallback(
    (collapsed: boolean) => {
      onSetCollapsedPath(member.field.path, collapsed)
    },
    [onSetCollapsedPath, member.field.path]
  )

  const handleSelectFieldGroup = useCallback(
    (groupName: string) => {
      onSelectFieldGroup(member.field.path, groupName)
    },
    [onSelectFieldGroup, member.field.path]
  )

  const handleSetFieldSetCollapsed = useCallback(
    (fieldsetName: string, collapsed: boolean) => {
      onSetCollapsedFieldSet(member.field.path, collapsed)
    },
    [onSetCollapsedFieldSet, member.field.path]
  )
  const handleSetFieldCollapsed = useCallback(
    (fieldName: string, collapsed: boolean) => {
      onSetCollapsedPath(member.field.path.concat(fieldName), collapsed)
    },
    [onSetCollapsedPath, member.field.path]
  )

  const inputProps = useMemo((): ObjectInputProps => {
    return {
      level: member.field.level,
      onBlur: handleBlur,
      members: member.field.members,
      value: member.field.value,
      readOnly: member.field.readOnly,
      onSetCollapsed: handleSetCollapsed,
      schemaType: member.field.schemaType,
      compareValue: member.field.compareValue,
      focusRef: focusRef,
      id: member.field.id,
      collapsed: member.collapsed,
      onSelectFieldGroup: handleSelectFieldGroup,
      onSetFieldSetCollapsed: handleSetFieldSetCollapsed,
      onSetFieldCollapsed: handleSetFieldCollapsed,
      onFocus: handleFocus,
      onFocusPath: handleFocusChildPath,
      path: member.field.path,
      focusPath: member.field.focusPath,
      focused: member.field.focused,
      groups: member.field.groups,
      onChange: handleChange,
      renderField,
      renderInput,
      renderItem,
      // todo
      validation: EMPTY_ARRAY,
      presence: EMPTY_ARRAY,
    }
  }, [
    member.field.level,
    member.field.members,
    member.field.value,
    member.field.readOnly,
    member.field.schemaType,
    member.field.compareValue,
    member.field.id,
    member.field.path,
    member.field.focusPath,
    member.field.focused,
    member.field.groups,
    member.collapsed,
    handleBlur,
    handleSetCollapsed,
    handleSelectFieldGroup,
    handleSetFieldSetCollapsed,
    handleSetFieldCollapsed,
    handleFocus,
    handleFocusChildPath,
    handleChange,
    renderField,
    renderInput,
    renderItem,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const fieldProps = useMemo((): ObjectFieldProps => {
    return {
      name: member.name,
      index: member.index,
      level: member.field.level,
      value: member.field.value,
      title: member.field.schemaType.title,
      description: member.field.schemaType.description,
      collapsible: member.collapsible,
      collapsed: member.collapsed,
      onSetCollapsed: handleSetCollapsed,
      schemaType: member.field.schemaType,
      inputId: member.field.id,
      path: member.field.path,
      children: renderedInput,
    }
  }, [
    member.field.level,
    member.field.value,
    member.field.schemaType,
    member.field.id,
    member.field.path,
    member.collapsible,
    member.collapsed,
    member.index,
    member.name,
    renderedInput,
    handleSetCollapsed,
  ])

  return (
    <FormCallbacksProvider
      onSelectFieldGroup={onSelectFieldGroup}
      onChange={handleChange}
      onSetCollapsedFieldSet={onSetCollapsedFieldSet}
      onSetCollapsedPath={onSetCollapsedPath}
      onPathBlur={onPathBlur}
      onPathFocus={onPathFocus}
    >
      {useMemo(() => renderField(fieldProps), [fieldProps, renderField])}
    </FormCallbacksProvider>
  )
}
