import React, {useCallback, useMemo, useRef} from 'react'
import {Path} from '@sanity/types'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {FieldMember, ObjectFormNode} from '../../../store'
import {
  ArrayOfObjectsInputProps,
  ObjectFieldProps,
  ObjectInputProps,
  RenderArrayOfObjectsItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../../types'
import {PatchArg, PatchEvent, setIfMissing} from '../../../patch'
import {FormCallbacksProvider, useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {createProtoValue} from '../../../utils/createProtoValue'

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
  renderPreview: RenderPreviewCallback
}) {
  const {
    onPathBlur,
    onPathFocus,
    onChange,
    onPathOpen,
    onSetPathCollapsed,
    onSetFieldSetCollapsed,
    onFieldGroupSelect,
  } = useFormCallbacks()

  const {member, renderField, renderInput, renderItem, renderPreview} = props
  const focusRef = useRef<{focus: () => void}>()

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  const handleBlur = useCallback(() => {
    onPathBlur(member.field.path)
  }, [member.field.path, onPathBlur])

  const handleFocus = useCallback(() => {
    onPathFocus(member.field.path)
  }, [member.field.path, onPathFocus])

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
    onSetPathCollapsed(member.field.path, true)
  }, [onSetPathCollapsed, member.field.path])

  const handleExpand = useCallback(() => {
    onSetPathCollapsed(member.field.path, false)
  }, [onSetPathCollapsed, member.field.path])

  const handleCollapseField = useCallback(
    (fieldName: string) => {
      onSetPathCollapsed(member.field.path.concat(fieldName), true)
    },
    [onSetPathCollapsed, member.field.path]
  )
  const handleExpandField = useCallback(
    (fieldName: string) => {
      onSetPathCollapsed(member.field.path.concat(fieldName), false)
    },
    [onSetPathCollapsed, member.field.path]
  )
  const handleOpenField = useCallback(
    (fieldName: string) => {
      onPathOpen(member.field.path.concat(fieldName))
    },
    [onPathOpen, member.field.path]
  )
  const handleCloseField = useCallback(() => {
    onPathOpen(member.field.path)
  }, [onPathOpen, member.field.path])
  const handleExpandFieldSet = useCallback(
    (fieldsetName: string) => {
      onSetFieldSetCollapsed(member.field.path.concat(fieldsetName), false)
    },
    [onSetFieldSetCollapsed, member.field.path]
  )
  const handleCollapseFieldSet = useCallback(
    (fieldsetName: string) => {
      onSetFieldSetCollapsed(member.field.path.concat(fieldsetName), true)
    },
    [onSetFieldSetCollapsed, member.field.path]
  )

  const handleOpen = useCallback(() => {
    onPathOpen(member.field.path)
  }, [onPathOpen, member.field.path])

  const handleClose = useCallback(() => {
    onPathOpen(member.field.path.slice(0, -1))
  }, [onPathOpen, member.field.path])

  const handleSelectFieldGroup = useCallback(
    (groupName: string) => {
      onFieldGroupSelect(member.field.path, groupName)
    },
    [onFieldGroupSelect, member.field.path]
  )

  const elementProps = useMemo(
    (): ArrayOfObjectsInputProps['elementProps'] => ({
      onBlur: handleBlur,
      onFocus: handleFocus,
      id: member.field.id,
      ref: focusRef,
    }),
    [handleBlur, handleFocus, member.field.id]
  )

  const inputProps = useMemo((): Omit<ObjectInputProps, 'renderDefault'> => {
    return {
      elementProps,
      level: member.field.level,
      members: member.field.members,
      value: member.field.value,
      readOnly: member.field.readOnly,
      validation: member.field.validation,
      presence: member.field.presence,
      schemaType: member.field.schemaType,
      changed: member.field.changed,
      id: member.field.id,
      onFieldGroupSelect: handleSelectFieldGroup,
      onFieldOpen: handleOpenField,
      onFieldClose: handleCloseField,
      onFieldCollapse: handleCollapseField,
      onFieldExpand: handleExpandField,
      onFieldSetExpand: handleExpandFieldSet,
      onFieldSetCollapse: handleCollapseFieldSet,
      onPathFocus: handleFocusChildPath,
      path: member.field.path,
      focusPath: member.field.focusPath,
      focused: member.field.focused,
      groups: member.field.groups,
      onChange: handleChange,
      renderField,
      renderInput,
      renderItem,
      renderPreview,
    }
  }, [
    elementProps,
    member.field.level,
    member.field.members,
    member.field.value,
    member.field.readOnly,
    member.field.validation,
    member.field.presence,
    member.field.schemaType,
    member.field.changed,
    member.field.id,
    member.field.path,
    member.field.focusPath,
    member.field.focused,
    member.field.groups,
    handleSelectFieldGroup,
    handleOpenField,
    handleCloseField,
    handleCollapseField,
    handleExpandField,
    handleExpandFieldSet,
    handleCollapseFieldSet,
    handleFocusChildPath,
    handleChange,
    renderField,
    renderInput,
    renderItem,
    renderPreview,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const fieldProps = useMemo((): Omit<ObjectFieldProps, 'renderDefault'> => {
    return {
      name: member.name,
      index: member.index,
      level: member.field.level,
      value: member.field.value,
      validation: member.field.validation,
      presence: member.field.presence,
      title: member.field.schemaType.title,
      description: member.field.schemaType.description,

      collapsible: member.collapsible,
      collapsed: member.collapsed,
      onCollapse: handleCollapse,
      onExpand: handleExpand,

      open: member.open,
      changed: member.field.changed,

      onOpen: handleOpen,
      onClose: handleClose,

      schemaType: member.field.schemaType,
      inputId: member.field.id,
      path: member.field.path,
      children: renderedInput,
      inputProps: inputProps as ObjectInputProps,
    }
  }, [
    member.name,
    member.index,
    member.field.changed,
    member.field.level,
    member.field.value,
    member.field.validation,
    member.field.presence,
    member.field.schemaType,
    member.field.id,
    member.field.path,
    member.collapsible,
    member.collapsed,
    member.open,
    handleCollapse,
    handleExpand,
    handleOpen,
    handleClose,
    renderedInput,
    inputProps,
  ])

  return (
    <FormCallbacksProvider
      onFieldGroupSelect={onFieldGroupSelect}
      onChange={handleChange}
      onSetFieldSetCollapsed={onSetFieldSetCollapsed}
      onPathOpen={onPathOpen}
      onSetPathCollapsed={onSetPathCollapsed}
      onPathBlur={onPathBlur}
      onPathFocus={onPathFocus}
    >
      {useMemo(() => renderField(fieldProps), [fieldProps, renderField])}
    </FormCallbacksProvider>
  )
}
