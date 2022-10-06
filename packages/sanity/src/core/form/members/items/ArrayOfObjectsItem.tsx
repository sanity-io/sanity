import React, {useCallback, useMemo, useRef} from 'react'
import {Path} from '@sanity/types'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {
  ObjectInputProps,
  ObjectItemProps,
  RenderArrayOfObjectsItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../types'
import {insert, PatchArg, PatchEvent, setIfMissing, unset} from '../../patch'
import {ensureKey} from '../../utils/ensureKey'
import {FormCallbacksProvider, useFormCallbacks} from '../../studio/contexts/FormCallbacks'
import {ArrayOfObjectsItemMember} from '../../store'
import {createProtoValue} from '../../utils/createProtoValue'
import {isEmpty} from '../../inputs/arrays/ArrayOfObjectsInput/item/helpers'

/**
 * @beta
 */
export interface MemberItemProps {
  member: ArrayOfObjectsItemMember
  renderItem: RenderArrayOfObjectsItemCallback
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderPreview: RenderPreviewCallback
}

/**
 * @beta
 */
export function ArrayOfObjectsItem(props: MemberItemProps) {
  const focusRef = useRef<{focus: () => void}>()
  const {member, renderItem, renderInput, renderField, renderPreview} = props

  const {
    onPathBlur,
    onPathFocus,
    onChange,
    onPathOpen,
    onSetPathCollapsed,
    onSetFieldSetCollapsed,
    onFieldGroupSelect,
  } = useFormCallbacks()

  useDidUpdate(member.item.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  const onRemove = useCallback(() => {
    onChange(PatchEvent.from([unset([{_key: member.key}])]))
  }, [member.key, onChange])

  const onInsert = useCallback(
    (event: {items: unknown[]; position: 'before' | 'after'}) => {
      onChange(
        PatchEvent.from([
          insert(
            event.items.map((item) => ensureKey(item)),
            event.position,
            [{_key: member.key}]
          ),
        ])
      )
    },
    [member.key, onChange]
  )

  const handleBlur = useCallback(() => {
    onPathBlur(member.item.path)
  }, [member.item.path, onPathBlur])

  const handleFocus = useCallback(() => {
    onPathFocus(member.item.path)
  }, [member.item.path, onPathFocus])

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
  const handleCollapse = useCallback(() => {
    onSetPathCollapsed(member.item.path, true)
  }, [onSetPathCollapsed, member.item.path])

  const handleExpand = useCallback(() => {
    onSetPathCollapsed(member.item.path, false)
  }, [onSetPathCollapsed, member.item.path])

  const handleCollapseField = useCallback(
    (fieldName: string) => {
      onSetPathCollapsed(member.item.path.concat(fieldName), true)
    },
    [onSetPathCollapsed, member.item.path]
  )
  const handleExpandField = useCallback(
    (fieldName: string) => {
      onSetPathCollapsed(member.item.path.concat(fieldName), false)
    },
    [onSetPathCollapsed, member.item.path]
  )
  const handleCloseField = useCallback(() => {
    onPathOpen(member.item.path)
  }, [onPathOpen, member.item.path])
  const handleOpenField = useCallback(
    (fieldName: string) => {
      onPathOpen(member.item.path.concat(fieldName))
    },
    [onPathOpen, member.item.path]
  )
  const handleExpandFieldSet = useCallback(
    (fieldsetName: string) => {
      onSetFieldSetCollapsed(member.item.path.concat(fieldsetName), false)
    },
    [onSetFieldSetCollapsed, member.item.path]
  )
  const handleCollapseFieldSet = useCallback(
    (fieldsetName: string) => {
      onSetFieldSetCollapsed(member.item.path.concat(fieldsetName), true)
    },
    [onSetFieldSetCollapsed, member.item.path]
  )

  const handleOpen = useCallback(() => {
    onPathOpen(member.item.path)
  }, [onPathOpen, member.item.path])

  const isEmptyValue = !member.item.value || isEmpty(member.item.value)
  const handleClose = useCallback(() => {
    if (isEmptyValue) {
      onRemove()
    }
    onPathOpen(member.item.path.slice(0, -1))
  }, [onPathOpen, member.item.path, isEmptyValue, onRemove])

  const handleSelectFieldGroup = useCallback(
    (groupName: string) => {
      onFieldGroupSelect(member.item.path, groupName)
    },
    [onFieldGroupSelect, member.item.path]
  )

  const elementProps = useMemo(
    (): ObjectInputProps['elementProps'] => ({
      onBlur: handleBlur,
      onFocus: handleFocus,
      id: member.item.id,
      ref: focusRef,
    }),
    [handleBlur, handleFocus, member.item.id]
  )

  const inputProps = useMemo((): Omit<ObjectInputProps, 'renderDefault'> => {
    return {
      changed: member.item.changed,
      focusPath: member.item.focusPath,
      focused: member.item.focused,
      groups: member.item.groups,
      id: member.item.id,
      level: member.item.level,
      members: member.item.members,
      onChange: handleChange,
      onCloseField: handleCloseField,
      onCollapseField: handleCollapseField,
      onCollapseFieldSet: handleCollapseFieldSet,
      onExpandField: handleExpandField,
      onExpandFieldSet: handleExpandFieldSet,
      onFieldGroupSelect: handleSelectFieldGroup,
      onFocusPath: handleFocusChildPath,
      onOpenField: handleOpenField,
      path: member.item.path,
      presence: member.item.presence,
      readOnly: member.item.readOnly,
      renderField,
      renderInput,
      renderItem,
      renderPreview,
      schemaType: member.item.schemaType,
      validation: member.item.validation,
      value: member.item.value,
      elementProps: elementProps,
    }
  }, [
    elementProps,
    handleChange,
    handleCloseField,
    handleCollapseField,
    handleCollapseFieldSet,
    handleExpandField,
    handleExpandFieldSet,
    handleFocusChildPath,
    handleOpenField,
    handleSelectFieldGroup,
    member.item.changed,
    member.item.focusPath,
    member.item.focused,
    member.item.groups,
    member.item.id,
    member.item.level,
    member.item.members,
    member.item.path,
    member.item.presence,
    member.item.readOnly,
    member.item.schemaType,
    member.item.validation,
    member.item.value,
    renderField,
    renderInput,
    renderItem,
    renderPreview,
  ])

  const renderedInput = useMemo(
    () => renderInput(inputProps as ObjectInputProps),
    [inputProps, renderInput]
  )

  const itemProps = useMemo((): Omit<ObjectItemProps, 'renderDefault'> => {
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
      onInsert,
      onRemove,
      presence: member.item.presence,
      validation: member.item.validation,
      open: member.open,
      onOpen: handleOpen,
      onClose: handleClose,
      onExpand: handleExpand,
      onCollapse: handleCollapse,
      readOnly: member.item.readOnly,
      focused: member.item.focused,
      onFocus: handleFocus,
      inputId: member.item.id,
      path: member.item.path,
      children: renderedInput,
      changed: member.item.changed,
    }
  }, [
    member.key,
    member.index,
    member.item.level,
    member.item.value,
    member.item.schemaType,
    member.item.presence,
    member.item.validation,
    member.item.readOnly,
    member.item.focused,
    member.item.id,
    member.item.path,
    member.item.changed,
    member.collapsible,
    member.collapsed,
    member.open,
    onInsert,
    onRemove,
    handleOpen,
    handleClose,
    handleExpand,
    handleCollapse,
    handleFocus,
    renderedInput,
  ])

  return (
    <FormCallbacksProvider
      onFieldGroupSelect={onFieldGroupSelect}
      onChange={handleChange}
      onPathOpen={onPathOpen}
      onSetFieldSetCollapsed={onSetFieldSetCollapsed}
      onSetPathCollapsed={onSetPathCollapsed}
      onPathBlur={onPathBlur}
      onPathFocus={onPathFocus}
    >
      {useMemo(() => renderItem(itemProps as ObjectItemProps), [itemProps, renderItem])}
    </FormCallbacksProvider>
  )
}
