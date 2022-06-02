import React, {useCallback, useMemo, useRef} from 'react'
import {Path} from '@sanity/types'
import {isEqual, startsWith} from '@sanity/util/paths'
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
import {useValidationMarkers} from '../../../studio/contexts/Validation'
import {useFormFieldPresence} from '../../../studio/contexts/Presence'

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
    onOpenPath,
    onSetCollapsedPath,
    onSetCollapsedFieldSet,
    onSelectFieldGroup,
  } = useFormCallbacks()

  const rootValidation = useValidationMarkers()
  const rootPresence = useFormFieldPresence()

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

  const handleCollapse = useCallback(() => {
    onSetCollapsedPath(member.field.path, true)
  }, [onSetCollapsedPath, member.field.path])

  const handleExpand = useCallback(() => {
    onSetCollapsedPath(member.field.path, false)
  }, [onSetCollapsedPath, member.field.path])

  const handleCollapseField = useCallback(
    (fieldName: string) => {
      onSetCollapsedPath(member.field.path.concat(fieldName), true)
    },
    [onSetCollapsedPath, member.field.path]
  )
  const handleExpandField = useCallback(
    (fieldName: string) => {
      onSetCollapsedPath(member.field.path.concat(fieldName), false)
    },
    [onSetCollapsedPath, member.field.path]
  )
  const handleOpenField = useCallback(
    (fieldName: string) => {
      onOpenPath(member.field.path.concat(fieldName))
    },
    [onOpenPath, member.field.path]
  )
  const handleCloseField = useCallback(
    (fieldName: string) => {
      onOpenPath(member.field.path)
    },
    [onOpenPath, member.field.path]
  )
  const handleExpandFieldSet = useCallback(
    (fieldsetName: string) => {
      onSetCollapsedFieldSet(member.field.path.concat(fieldsetName), false)
    },
    [onSetCollapsedFieldSet, member.field.path]
  )
  const handleCollapseFieldSet = useCallback(
    (fieldsetName: string) => {
      onSetCollapsedFieldSet(member.field.path.concat(fieldsetName), true)
    },
    [onSetCollapsedFieldSet, member.field.path]
  )

  const handleOpen = useCallback(() => {
    onOpenPath(member.field.path)
  }, [onOpenPath, member.field.path])

  const handleClose = useCallback(() => {
    onOpenPath(member.field.path.slice(0, -1))
  }, [onOpenPath, member.field.path])

  const handleSelectFieldGroup = useCallback(
    (groupName: string) => {
      onSelectFieldGroup(member.field.path, groupName)
    },
    [onSelectFieldGroup, member.field.path]
  )

  const presence = useMemo(() => {
    return rootPresence.filter((item) =>
      member.collapsed
        ? startsWith(item.path, member.field.path)
        : isEqual(item.path, member.field.path)
    )
  }, [member.collapsed, member.field.path, rootPresence])

  const validation = useMemo(() => {
    return rootValidation.filter((item) =>
      member.collapsed
        ? startsWith(item.path, member.field.path)
        : isEqual(item.path, member.field.path)
    )
  }, [member.collapsed, member.field.path, rootValidation])

  const inputProps = useMemo((): ObjectInputProps => {
    return {
      level: member.field.level,
      onBlur: handleBlur,
      members: member.field.members,
      value: member.field.value,
      readOnly: member.field.readOnly,
      onCollapse: handleCollapse,
      onExpand: handleExpand,
      schemaType: member.field.schemaType,
      compareValue: member.field.compareValue,
      focusRef: focusRef,
      id: member.field.id,
      collapsed: member.collapsed,
      onSelectFieldGroup: handleSelectFieldGroup,
      onOpenField: handleOpenField,
      onCloseField: handleCloseField,
      onCollapseField: handleCollapseField,
      onExpandField: handleExpandField,
      onExpandFieldSet: handleExpandFieldSet,
      onCollapseFieldSet: handleCollapseFieldSet,
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
      validation,
      presence,
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
    handleCollapse,
    handleExpand,
    handleSelectFieldGroup,
    handleCollapseField,
    handleExpandField,
    handleExpandFieldSet,
    handleCollapseFieldSet,
    handleFocus,
    handleFocusChildPath,
    handleChange,
    renderField,
    renderInput,
    renderItem,
    validation,
    presence,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const fieldProps = useMemo((): ObjectFieldProps => {
    return {
      name: member.name,
      index: member.index,
      level: member.field.level,
      value: member.field.value,
      presence,
      validation,
      title: member.field.schemaType.title,
      description: member.field.schemaType.description,

      collapsible: member.collapsible,
      collapsed: member.collapsed,
      onCollapse: handleCollapse,
      onExpand: handleExpand,

      open: member.open,

      onOpen: handleOpen,
      onClose: handleClose,

      schemaType: member.field.schemaType,
      inputId: member.field.id,
      path: member.field.path,
      children: renderedInput,
    }
  }, [
    member.name,
    member.index,
    member.field.level,
    member.field.value,
    member.field.schemaType,
    member.field.id,
    member.field.path,
    member.collapsible,
    member.collapsed,
    member.open,
    presence,
    validation,
    handleCollapse,
    handleExpand,
    handleOpen,
    handleClose,
    renderedInput,
  ])

  return (
    <FormCallbacksProvider
      onSelectFieldGroup={onSelectFieldGroup}
      onChange={handleChange}
      onSetCollapsedFieldSet={onSetCollapsedFieldSet}
      onOpenPath={onOpenPath}
      onSetCollapsedPath={onSetCollapsedPath}
      onPathBlur={onPathBlur}
      onPathFocus={onPathFocus}
    >
      {useMemo(() => renderField(fieldProps), [fieldProps, renderField])}
    </FormCallbacksProvider>
  )
}
