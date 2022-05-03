import React, {useCallback, useMemo, useRef} from 'react'
import {FieldMember} from '../../../store/types/members'
import {ArrayOfObjectsNode} from '../../../store/types/nodes'
import {
  ArrayOfObjectsInputProps,
  InsertEvent,
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
} from '../../../types'
import {FormCallbacksProvider, useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {insert, PatchArg, PatchEvent, setIfMissing, unset} from '../../../patch'
import {createProtoValue} from '../../../utils/createProtoValue'
import {ArrayFieldProps} from '../../../types/fieldProps'

/**
 * Responsible for creating inputProps and fieldProps to pass to ´renderInput´ and ´renderField´ for an array input
 * Note: "ArrayField" in this context means an object field of an array type
 * @param props - Component props
 */
export function ArrayField(props: {
  member: FieldMember<ArrayOfObjectsNode>
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderItemCallback
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

  const handleInsert = useCallback(
    (event: InsertEvent) => {
      const ref =
        typeof event.referenceItem === 'string' ? {_key: event.referenceItem} : event.referenceItem
      onChange(
        PatchEvent.from([setIfMissing([]), insert(event.items, event.position, [ref])]).prefixAll(
          member.name
        )
      )
    },
    [member.name, onChange]
  )

  const handleSetCollapsed = useCallback(
    (collapsed: boolean) => {
      onSetCollapsedPath(member.field.path, collapsed)
    },
    [onSetCollapsedPath, member.field.path]
  )

  const handleRemoveItem = useCallback(
    (itemKey: string) => {
      onChange(PatchEvent.from([unset(member.field.path.concat({_key: itemKey}))]))
    },
    [onChange, member.field.path]
  )

  const handleSetItemCollapsed = useCallback(
    (itemKey: string, collapsed: boolean) => {
      onSetCollapsedPath(member.field.path.concat({_key: itemKey}), collapsed)
    },
    [onSetCollapsedPath, member.field.path]
  )

  const inputProps = useMemo((): ArrayOfObjectsInputProps => {
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
      onSetItemCollapsed: handleSetItemCollapsed,
      onFocus: handleFocus,
      path: member.field.path,
      focusPath: member.field.focusPath,
      focused: member.field.focused,
      onChange: handleChange,
      onInsert: handleInsert,
      onRemoveItem: handleRemoveItem,
      // todo:
      validation: [],
      renderInput,
      renderField,
      renderItem,
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
    handleBlur,
    handleSetCollapsed,
    handleSetItemCollapsed,
    handleFocus,
    handleChange,
    handleInsert,
    handleRemoveItem,
    renderInput,
    renderField,
    renderItem,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const fieldProps = useMemo((): ArrayFieldProps => {
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
      onPathFocus={onPathBlur}
    >
      {renderField(fieldProps)}
    </FormCallbacksProvider>
  )
}
