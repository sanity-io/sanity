import * as React from 'react'
import {memo, useCallback, useMemo, useRef} from 'react'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {
  ObjectInputProps,
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
} from '../../../types'
import {ArrayOfObjectsMember} from '../../../store/types/members'
import {ItemProps} from '../../../types/itemProps'
import {FormCallbacksProvider, useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {Path} from '@sanity/types'
import {PatchArg, PatchEvent, setIfMissing} from '../../../patch'
import {createProtoValue} from '../../../utils/createProtoValue'

interface Props {
  member: ArrayOfObjectsMember
  renderItem: RenderItemCallback
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
}

export const ItemMember = memo(function ItemMember(props: Props) {
  const focusRef = useRef<{focus: () => void}>()
  const {member, renderItem, renderInput, renderField} = props

  const {
    onPathBlur,
    onPathFocus,
    onChange,
    onSetCollapsedPath,
    onSetCollapsedFieldSet,
    onSelectFieldGroup,
  } = useFormCallbacks()

  useDidUpdate(member.item.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  const handleBlur = useCallback(
    (event: React.FocusEvent) => {
      onPathBlur(member.item.path)
    },
    [member.item.path, onPathBlur]
  )

  const handleFocus = useCallback(
    (event: React.FocusEvent) => {
      onPathFocus(member.item.path)
    },
    [member.item.path, onPathFocus]
  )

  const handleFocusChildPath = useCallback(
    (path: Path) => {
      onPathFocus(member.item.path.concat(path))
    },
    [member.item.path, onPathFocus]
  )

  const handleChange = useCallback(
    (event: PatchEvent | PatchArg) => {
      onChange(
        PatchEvent.from(event)
          .prepend(setIfMissing(createProtoValue(member.item.schemaType)))
          .prefixAll({_key: member.key})
      )
    },
    [onChange, member.item.schemaType, member.key]
  )

  const handleSetCollapsed = useCallback(
    (collapsed: boolean) => {
      onSetCollapsedPath(member.item.path, collapsed)
    },
    [onSetCollapsedPath, member.item.path]
  )

  const handleSelectFieldGroup = useCallback(
    (groupName: string) => {
      onSelectFieldGroup(member.item.path, groupName)
    },
    [onSelectFieldGroup, member.item.path]
  )

  const handleSetFieldSetCollapsed = useCallback(
    (itemsetName: string, collapsed: boolean) => {
      onSetCollapsedFieldSet(member.item.path, collapsed)
    },
    [onSetCollapsedFieldSet, member.item.path]
  )
  const handleSetFieldCollapsed = useCallback(
    (itemName: string, collapsed: boolean) => {
      onSetCollapsedPath(member.item.path.concat(itemName), collapsed)
    },
    [onSetCollapsedPath, member.item.path]
  )

  const inputProps = useMemo((): ObjectInputProps => {
    return {
      level: member.item.level,
      onBlur: handleBlur,
      members: member.item.members,
      value: member.item.value,
      readOnly: member.item.readOnly,
      onSetCollapsed: handleSetCollapsed,
      schemaType: member.item.schemaType,
      compareValue: member.item.compareValue,
      focusRef: focusRef,
      id: member.item.id,
      onSelectFieldGroup: handleSelectFieldGroup,
      onSetFieldSetCollapsed: handleSetFieldSetCollapsed,
      onSetFieldCollapsed: handleSetFieldCollapsed,
      onFocus: handleFocus,
      onFocusChildPath: handleFocusChildPath,
      path: member.item.path,
      focusPath: member.item.focusPath,
      focused: member.item.focused,
      groups: member.item.groups,
      onChange: handleChange,
      renderField,
      renderInput,
      // todo
      validation: [],
    }
  }, [
    member.item.level,
    member.item.members,
    member.item.value,
    member.item.readOnly,
    member.item.schemaType,
    member.item.compareValue,
    member.item.id,
    member.item.path,
    member.item.focusPath,
    member.item.focused,
    member.item.groups,
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
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const itemProps = useMemo((): ItemProps => {
    return {
      key: member.key,
      index: member.index,
      level: member.item.level,
      value: member.item.value,
      title: member.item.schemaType.title,
      description: member.item.schemaType.description,
      collapsible: member.collapsible,
      collapsed: member.collapsed,
      schemaType: member.item.schemaType,
      inputId: member.item.id,
      path: member.item.path,
      onSetCollapsed: handleSetCollapsed,
      children: renderedInput,
    }
  }, [
    member.key,
    member.index,
    member.item.level,
    member.item.value,
    member.item.schemaType,
    member.item.id,
    member.item.path,
    member.collapsible,
    member.collapsed,
    renderedInput,
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
      {renderItem(itemProps)}
    </FormCallbacksProvider>
  )
})
