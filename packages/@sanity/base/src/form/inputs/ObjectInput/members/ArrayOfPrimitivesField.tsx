import React, {useCallback, useMemo, useRef} from 'react'
import {FieldMember} from '../../../store/types/members'
import {ArrayOfPrimitivesNode} from '../../../store/types/nodes'
import {
  ArrayOfPrimitivesInputProps,
  MoveItemEvent,
  RenderFieldCallback,
  RenderInputCallback,
  RenderArrayOfPrimitivesItemCallback,
} from '../../../types'
import {FormCallbacksProvider, useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {insert, PatchArg, PatchEvent, set, setIfMissing, unset} from '../../../patch'
import {createProtoValue} from '../../../utils/createProtoValue'
import {ArrayFieldProps} from '../../../types/fieldProps'
import {EMPTY_ARRAY} from '../../../utils/empty'
import {PrimitiveValue} from '../../arrays/ArrayOfPrimitivesInput/types'

function move<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice()
  const val = copy[from]
  copy.splice(from, 1)
  copy.splice(to, 0, val)
  return copy
}

/**
 * @example
 * Inserts "hello" at the beginning
 * ```ts
 * insertAfter(-1, ["one", "two"], "hello")
 * // => ["hello", "one", "two"]
 * ```
 */
function insertAfter<T>(
  /**
   * index to insert item after. An index of -1 will prepend the item
   */
  index: number,
  /**
   * the array to insert the item into
   */
  arr: T[],
  /**
   * the item to insert
   */
  items: T[]
): T[] {
  const copy = arr.slice()
  copy.splice(index + 1, 0, ...items)
  return copy
}

/**
 * Responsible for creating inputProps and fieldProps to pass to ´renderInput´ and ´renderField´ for an array input
 * Note: "ArrayField" in this context means an object field of an array type
 * @param props - Component props
 */
export function ArrayOfPrimitivesField(props: {
  member: FieldMember<ArrayOfPrimitivesNode>
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfPrimitivesItemCallback
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

  const handleMoveItem = useCallback(
    (event: MoveItemEvent) => {
      const value = member.field.value
      const item = value?.[event.fromIndex] as any
      if (event.fromIndex === event.toIndex) {
        return
      }

      onChange(
        PatchEvent.from([
          unset([item.index]),
          insert([item], event.fromIndex > event.toIndex ? 'before' : 'after', [item.index]),
        ]).prefixAll(member.name)
      )
    },
    [member.field.value, member.name, onChange]
  )

  const handleSetCollapsed = useCallback(
    (collapsed: boolean) => {
      onSetCollapsedPath(member.field.path, collapsed)
    },
    [onSetCollapsedPath, member.field.path]
  )

  const setValue = useCallback(
    (nextValue: PrimitiveValue[]) => {
      onChange(
        PatchEvent.from(nextValue.length === 0 ? unset() : set(nextValue)).prefixAll(member.name)
      )
    },
    [member.name, onChange]
  )

  const handleRemove = useCallback(
    (index: number) => {
      const {value = []} = member.field
      setValue(value.filter((_, i) => i !== index))
    },
    [member.field, setValue]
  )

  const handleAppend = useCallback(
    (itemValue: PrimitiveValue) => {
      const {value = []} = member.field
      setValue(value.concat(itemValue))
    },
    [member.field, setValue]
  )

  const handlePrepend = useCallback(
    (itemValue: PrimitiveValue) => {
      const {value = []} = member.field
      setValue([itemValue].concat(value || []))
    },
    [member.field, setValue]
  )

  const handleInsert = useCallback(
    (event: {items: PrimitiveValue[]; position: 'before' | 'after'; referenceIndex: number}) => {
      const {value = []} = member.field

      const insertIndex = event.referenceIndex + (event.position === 'before' ? -1 : 0)
      setValue(insertAfter(insertIndex, value, event.items))
    },
    [member.field, setValue]
  )

  const handleRemoveItem = useCallback(
    (index: number) => {
      onChange(PatchEvent.from([unset(member.field.path.concat(index))]))
    },
    [onChange, member.field.path]
  )

  const handleSetItemCollapsed = useCallback(
    (itemKey: string, collapsed: boolean) => {
      onSetCollapsedPath(member.field.path.concat({_key: itemKey}), collapsed)
    },
    [onSetCollapsedPath, member.field.path]
  )
  const handleFocusIndex = useCallback(
    (index: number) => {
      onPathFocus(member.field.path.concat([index]))
    },
    [member.field.path, onPathFocus]
  )

  const inputProps = useMemo((): ArrayOfPrimitivesInputProps => {
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
      onFocus: handleFocus,
      path: member.field.path,
      focusPath: member.field.focusPath,
      focused: member.field.focused,
      onChange: handleChange,
      onInsert: handleInsert,
      onMoveItem: handleMoveItem,
      onRemoveItem: handleRemove,
      onAppendItem: handleAppend,
      onPrependItem: handlePrepend,
      // todo:
      validation: EMPTY_ARRAY,
      // todo:
      presence: EMPTY_ARRAY,
      renderInput,
      renderItem,
      onFocusIndex: handleFocusIndex,
      collapsible: member.collapsible,
      collapsed: member.collapsed,
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
    member.collapsible,
    member.collapsed,
    handleBlur,
    handleSetCollapsed,
    handleFocus,
    handleChange,
    handleInsert,
    handleMoveItem,
    handleRemove,
    handleAppend,
    handlePrepend,
    renderInput,
    renderItem,
    handleFocusIndex,
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
