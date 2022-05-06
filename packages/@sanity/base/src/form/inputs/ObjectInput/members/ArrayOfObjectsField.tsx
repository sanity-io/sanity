import React, {useCallback, useMemo, useRef} from 'react'
import {Path} from '@sanity/types'
import {FieldMember} from '../../../store/types/members'
import {ArrayOfObjectsNode} from '../../../store/types/nodes'
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
import {EMPTY_ARRAY} from '../../../utils/empty'

/**
 * Responsible for creating inputProps and fieldProps to pass to ´renderInput´ and ´renderField´ for an array input
 * Note: "ArrayField" in this context means an object field of an array type
 * @param props - Component props
 */
export function ArrayOfObjectsField(props: {
  member: FieldMember<ArrayOfObjectsNode>
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
  const handleFocusChildPath = useCallback(
    (path: Path) => {
      onPathFocus(member.field.path.concat(path))
    },
    [member.field.path, onPathFocus]
  )

  const inputProps = useMemo((): ArrayOfObjectsInputProps => {
    return {
      level: member.field.level,
      onBlur: handleBlur,
      members: member.field.members,
      value: member.field.value as any,
      readOnly: member.field.readOnly,
      onSetCollapsed: handleSetCollapsed,
      schemaType: member.field.schemaType,
      compareValue: member.field.compareValue as any,
      focusRef: focusRef,
      id: member.field.id,
      onSetItemCollapsed: handleSetItemCollapsed,
      onFocus: handleFocus,
      path: member.field.path,
      focusPath: member.field.focusPath,
      focused: member.field.focused,
      onChange: handleChange,
      onInsert: handleInsert,
      onMoveItem: handleMoveItem,
      onRemoveItem: handleRemoveItem,
      onAppendItem: handleAppendItem,
      onPrependItem: handlePrependItem,
      onFocusPath: handleFocusChildPath,
      resolveInitialValue: resolveInitialValueForType,
      // todo:
      validation: EMPTY_ARRAY,
      // todo:
      presence: EMPTY_ARRAY,
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
    handleMoveItem,
    handleRemoveItem,
    handleAppendItem,
    handlePrependItem,
    handleFocusChildPath,
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
      onPathFocus={onPathFocus}
    >
      {useMemo(() => renderField(fieldProps), [fieldProps, renderField])}
    </FormCallbacksProvider>
  )
}
