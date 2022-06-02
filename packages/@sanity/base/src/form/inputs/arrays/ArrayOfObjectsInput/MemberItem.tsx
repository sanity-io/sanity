import * as React from 'react'
import {useCallback, useMemo, useRef} from 'react'
import {Path} from '@sanity/types'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {
  ObjectInputProps,
  RenderFieldCallback,
  RenderInputCallback,
  RenderArrayOfObjectsItemCallback,
} from '../../../types'
import {ArrayOfObjectsMember} from '../../../store/types/members'
import {ObjectItemProps} from '../../../types/itemProps'
import {FormCallbacksProvider, useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {insert, PatchArg, PatchEvent, setIfMissing, unset} from '../../../patch'
import {createProtoValue} from '../../../utils/createProtoValue'
import {ensureKey} from '../../../utils/ensureKey'
import {EMPTY_ARRAY} from '../../../utils/empty'

/**
 * @alpha
 */
export interface MemberItemProps {
  member: ArrayOfObjectsMember
  renderItem: RenderArrayOfObjectsItemCallback
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
}

/**
 * @alpha
 */
export function MemberItem(props: MemberItemProps) {
  const focusRef = useRef<{focus: () => void}>()
  const {member, renderItem, renderInput, renderField} = props

  const {
    onPathBlur,
    onPathFocus,
    onChange,
    onOpenPath,
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
  const handleCollapse = useCallback(() => {
    onSetCollapsedPath(member.item.path, true)
  }, [onSetCollapsedPath, member.item.path])

  const handleExpand = useCallback(() => {
    onSetCollapsedPath(member.item.path, false)
  }, [onSetCollapsedPath, member.item.path])

  const handleCollapseField = useCallback(
    (fieldName: string) => {
      onSetCollapsedPath(member.item.path.concat(fieldName), true)
    },
    [onSetCollapsedPath, member.item.path]
  )
  const handleExpandField = useCallback(
    (fieldName: string) => {
      onSetCollapsedPath(member.item.path.concat(fieldName), false)
    },
    [onSetCollapsedPath, member.item.path]
  )
  const handleCloseField = useCallback(
    (fieldName: string) => {
      onOpenPath(member.item.path.concat(fieldName))
    },
    [onOpenPath, member.item.path]
  )
  const handleOpenField = useCallback(
    (fieldName: string) => {
      onOpenPath(member.item.path)
    },
    [onOpenPath, member.item.path]
  )
  const handleExpandFieldSet = useCallback(
    (fieldsetName: string) => {
      onSetCollapsedFieldSet(member.item.path.concat(fieldsetName), false)
    },
    [onSetCollapsedFieldSet, member.item.path]
  )
  const handleCollapseFieldSet = useCallback(
    (fieldsetName: string) => {
      onSetCollapsedFieldSet(member.item.path.concat(fieldsetName), true)
    },
    [onSetCollapsedFieldSet, member.item.path]
  )

  const handleOpen = useCallback(() => {
    onOpenPath(member.item.path)
  }, [onOpenPath, member.item.path])

  const handleClose = useCallback(() => {
    onOpenPath(member.item.path.slice(0, -1))
  }, [onOpenPath, member.item.path])

  const handleSelectFieldGroup = useCallback(
    (groupName: string) => {
      onSelectFieldGroup(member.item.path, groupName)
    },
    [onSelectFieldGroup, member.item.path]
  )

  const inputProps = useMemo((): ObjectInputProps => {
    return {
      level: member.item.level,
      members: member.item.members,
      value: member.item.value,
      readOnly: member.item.readOnly,
      onExpand: handleExpand,
      onCollapse: handleCollapse,
      onExpandFieldSet: handleExpandFieldSet,
      onCollapseFieldSet: handleCollapseFieldSet,
      onExpandField: handleExpandField,
      onOpenField: handleOpenField,
      onCloseField: handleCloseField,
      onCollapseField: handleCollapseField,
      onSelectFieldGroup: handleSelectFieldGroup,
      schemaType: member.item.schemaType,
      compareValue: member.item.compareValue,
      focusRef: focusRef,
      id: member.item.id,
      onBlur: handleBlur,
      onFocus: handleFocus,
      onFocusPath: handleFocusChildPath,
      path: member.item.path,
      focusPath: member.item.focusPath,
      focused: member.item.focused,
      groups: member.item.groups,
      onChange: handleChange,
      collapsed: member.collapsed,
      renderField,
      renderInput,
      renderItem,
      // todo
      validation: EMPTY_ARRAY,
      presence: EMPTY_ARRAY,
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
    member.collapsed,
    handleExpand,
    handleCollapse,
    handleExpandFieldSet,
    handleCollapseFieldSet,
    handleExpandField,
    handleCollapseField,
    handleSelectFieldGroup,
    handleBlur,
    handleFocus,
    handleFocusChildPath,
    handleChange,
    renderField,
    renderInput,
    renderItem,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  // const onInsert = useCallback(() => {}, [member.key])
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

  const itemProps = useMemo((): ObjectItemProps => {
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
      open: member.open,
      onOpen: handleOpen,
      onClose: handleClose,
      onExpand: handleExpand,
      onCollapse: handleCollapse,
      validation: EMPTY_ARRAY,
      readOnly: member.item.readOnly,
      focused: member.item.focused,
      onFocus: handleFocus,
      inputId: member.item.id,
      path: member.item.path,
      children: renderedInput,
    }
  }, [
    member.key,
    member.index,
    member.item.level,
    member.item.value,
    member.item.schemaType,
    member.item.readOnly,
    member.item.focused,
    member.item.id,
    member.item.path,
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
      onSelectFieldGroup={onSelectFieldGroup}
      onChange={handleChange}
      onOpenPath={onOpenPath}
      onSetCollapsedFieldSet={onSetCollapsedFieldSet}
      onSetCollapsedPath={onSetCollapsedPath}
      onPathBlur={onPathBlur}
      onPathFocus={onPathFocus}
    >
      {useMemo(() => renderItem(itemProps), [itemProps, renderItem])}
    </FormCallbacksProvider>
  )
}
