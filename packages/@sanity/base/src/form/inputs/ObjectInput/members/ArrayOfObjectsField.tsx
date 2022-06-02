import React, {useCallback, useMemo, useRef} from 'react'
import {Path} from '@sanity/types'
import {isEqual, startsWith} from '@sanity/util/paths'
import {FieldMember} from '../../../store/types/members'
import {ArrayOfObjectsFormNode} from '../../../store/types/nodes'
import {
  ArrayOfObjectsInputProps,
  InsertItemEvent,
  MoveItemEvent,
  RenderFieldCallback,
  RenderInputCallback,
  RenderArrayOfObjectsItemCallback,
} from '../../../types'
import {FormCallbacksProvider, useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {insert, PatchArg, PatchEvent, setIfMissing, unset} from '../../../patch'
import {ArrayFieldProps} from '../../../types/fieldProps'
import {resolveInitialValueForType} from '../../../../templates'
import {ensureKey} from '../../../utils/ensureKey'
import {useFormFieldPresence} from '../../../studio/contexts/Presence'
import {useValidationMarkers} from '../../../studio/contexts/Validation'

/**
 * Responsible for creating inputProps and fieldProps to pass to ´renderInput´ and ´renderField´ for an array input
 * Note: "ArrayField" in this context means an object field of an array type
 * @param props - Component props
 */
export function ArrayOfObjectsField(props: {
  member: FieldMember<ArrayOfObjectsFormNode>
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
    onOpenPath,
    onSelectFieldGroup,
  } = useFormCallbacks()

  const rootPresence = useFormFieldPresence()
  const rootValidation = useValidationMarkers()

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
      onChange(PatchEvent.from(event).prepend(setIfMissing([])).prefixAll(member.name))
    },
    [onChange, member.name]
  )

  const handleInsert = useCallback(
    (event: InsertItemEvent) => {
      onChange(
        PatchEvent.from([
          setIfMissing([]),
          insert(
            event.items.map((item) => ensureKey(item)),
            event.position,
            [event.referenceItem]
          ),
        ]).prefixAll(member.name)
      )
    },
    [member.name, onChange]
  )

  const handleMoveItem = useCallback(
    (event: MoveItemEvent) => {
      const value = member.field.value
      const item = value?.[event.fromIndex] as any
      const refItem = value?.[event.toIndex] as any
      if (event.fromIndex === event.toIndex) {
        return
      }

      if (!(item as any)?._key || !(refItem as any)?._key) {
        // eslint-disable-next-line no-console
        console.error(
          'Neither the item you are moving nor the item you are moving to have a key. Cannot continue.'
        )

        return
      }

      onChange(
        PatchEvent.from([
          unset([{_key: item._key}]),
          insert([item], event.fromIndex > event.toIndex ? 'before' : 'after', [
            {_key: refItem._key},
          ]),
        ]).prefixAll(member.name)
      )
    },
    [member.field.value, member.name, onChange]
  )

  const handlePrependItem = useCallback(
    (item) => {
      onChange(
        PatchEvent.from([setIfMissing([]), insert([ensureKey(item)], 'before', [0])]).prefixAll(
          member.name
        )
      )
    },
    [member.name, onChange]
  )
  const handleAppendItem = useCallback(
    (item) => {
      onChange(
        PatchEvent.from([setIfMissing([]), insert([ensureKey(item)], 'after', [-1])]).prefixAll(
          member.name
        )
      )
    },
    [member.name, onChange]
  )

  const handleCollapse = useCallback(() => {
    onSetCollapsedPath(member.field.path, true)
  }, [onSetCollapsedPath, member.field.path])

  const handleExpand = useCallback(() => {
    onSetCollapsedPath(member.field.path, false)
  }, [onSetCollapsedPath, member.field.path])

  const handleCollapseItem = useCallback(
    (itemKey: string) => {
      onSetCollapsedPath(member.field.path.concat({_key: itemKey}), true)
    },
    [onSetCollapsedPath, member.field.path]
  )

  const handleExpandItem = useCallback(
    (itemKey: string) => {
      onSetCollapsedPath(member.field.path.concat({_key: itemKey}), false)
    },
    [onSetCollapsedPath, member.field.path]
  )

  const handleOpenItem = useCallback(
    (itemKey: string) => {
      onOpenPath(member.field.path.concat({_key: itemKey}))
    },
    [onOpenPath, member.field.path]
  )

  const handleCloseItem = useCallback(() => {
    onOpenPath(member.field.path)
  }, [onOpenPath, member.field.path])

  const handleRemoveItem = useCallback(
    (itemKey: string) => {
      onChange(PatchEvent.from([unset(member.field.path.concat({_key: itemKey}))]))
    },
    [onChange, member.field.path]
  )

  const handleFocusChildPath = useCallback(
    (path: Path) => {
      onPathFocus(member.field.path.concat(path))
    },
    [member.field.path, onPathFocus]
  )

  const presence = useMemo(() => {
    return rootPresence.filter((item) =>
      member.collapsed
        ? startsWith(item.path, member.field.path)
        : isEqual(item.path, member.field.path)
    )
  }, [member.collapsed, member.field.path, rootPresence])

  const validation = useMemo(() => {
    return rootValidation.filter((item) => {
      return member.collapsed
        ? startsWith(item.path, member.field.path)
        : isEqual(item.path, member.field.path)
    })
  }, [member.collapsed, member.field.path, rootValidation])

  const inputProps = useMemo((): ArrayOfObjectsInputProps => {
    return {
      level: member.field.level,
      onBlur: handleBlur,
      members: member.field.members,
      value: member.field.value as any,
      readOnly: member.field.readOnly,
      schemaType: member.field.schemaType,
      compareValue: member.field.compareValue as any,
      focusRef: focusRef,
      id: member.field.id,
      onExpand: handleExpand,
      onCollapse: handleCollapse,
      onExpandItem: handleExpandItem,
      onCollapseItem: handleCollapseItem,
      onCloseItem: handleCloseItem,
      onOpenItem: handleOpenItem,

      onFocus: handleFocus,
      focusPath: member.field.focusPath,
      focused: member.field.focused,

      path: member.field.path,

      onChange: handleChange,
      onInsert: handleInsert,
      onMoveItem: handleMoveItem,
      onRemoveItem: handleRemoveItem,
      onAppendItem: handleAppendItem,
      onPrependItem: handlePrependItem,
      onFocusPath: handleFocusChildPath,
      resolveInitialValue: resolveInitialValueForType,

      validation,
      presence,
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
    member.field.focusPath,
    member.field.focused,
    member.field.path,
    handleBlur,
    handleExpand,
    handleCollapse,
    handleExpandItem,
    handleCollapseItem,
    handleCloseItem,
    handleOpenItem,
    handleFocus,
    handleChange,
    handleInsert,
    handleMoveItem,
    handleRemoveItem,
    handleAppendItem,
    handlePrependItem,
    handleFocusChildPath,
    validation,
    presence,
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
      onCollapse: handleCollapse,
      onExpand: handleExpand,
      schemaType: member.field.schemaType,
      inputId: member.field.id,
      path: member.field.path,
      presence,
      validation,
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
    presence,
    validation,
    renderedInput,
  ])

  return (
    <FormCallbacksProvider
      onSelectFieldGroup={onSelectFieldGroup}
      onChange={handleChange}
      onSetCollapsedFieldSet={onSetCollapsedFieldSet}
      onSetCollapsedPath={onSetCollapsedPath}
      onOpenPath={onOpenPath}
      onPathBlur={onPathBlur}
      onPathFocus={onPathFocus}
    >
      {useMemo(() => renderField(fieldProps), [fieldProps, renderField])}
    </FormCallbacksProvider>
  )
}
