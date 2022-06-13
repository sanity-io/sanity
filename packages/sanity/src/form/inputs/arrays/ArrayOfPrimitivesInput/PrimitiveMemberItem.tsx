import * as React from 'react'
import {useCallback, useMemo, useRef} from 'react'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {ArrayOfPrimitivesItemMember} from '../../../store'
import {
  FIXME,
  PrimitiveInputProps,
  RenderArrayOfPrimitivesItemCallback,
  RenderInputCallback,
} from '../../../types'
import {PrimitiveItemProps} from '../../../types/itemProps'
import {useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {insert, PatchArg, PatchEvent, set, unset} from '../../../patch'
import {getEmptyValue} from './getEmptyValue'

/**
 * @alpha
 */
export interface PrimitiveMemberItemProps {
  member: ArrayOfPrimitivesItemMember
  renderItem: RenderArrayOfPrimitivesItemCallback
  renderInput: RenderInputCallback
}

/**
 * @alpha
 */
export function PrimitiveMemberItem(props: PrimitiveMemberItemProps) {
  const focusRef = useRef<{focus: () => void}>()
  const {member, renderItem, renderInput} = props

  const {onPathBlur, onPathFocus, onChange} = useFormCallbacks()

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

  const handleChange = useCallback(
    (event: PatchEvent | PatchArg) => {
      const patches = PatchEvent.from(event).patches.map((patch) =>
        // Map direct unset patches to empty value instead in order to not *remove* elements as the user clears out the value
        // note: this creates the rather "weird" case where the input renders ´0´ when you try to clear it
        patch.path.length === 0 && patch.type === 'unset'
          ? set(getEmptyValue(member.item.schemaType))
          : patch
      )
      onChange(PatchEvent.from(patches).prefixAll(member.index))
    },
    [onChange, member.item.schemaType, member.index]
  )

  const inputProps = useMemo((): PrimitiveInputProps => {
    return {
      changed: member.item.changed,
      level: member.item.level,
      value: member.item.value as FIXME,
      readOnly: member.item.readOnly,
      schemaType: member.item.schemaType as FIXME,
      focusRef: focusRef,
      id: member.item.id,
      onBlur: handleBlur,
      onFocus: handleFocus,
      path: member.item.path,
      focused: member.item.focused,
      onChange: handleChange,
      validation: member.item.validation,
      presence: member.item.presence,
    }
  }, [
    member.item.level,
    member.item.value,
    member.item.readOnly,
    member.item.schemaType,
    member.item.id,
    member.item.path,
    member.item.focused,
    member.item.validation,
    member.item.presence,
    member.item.changed,
    handleBlur,
    handleFocus,
    handleChange,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const onRemove = useCallback(() => {
    onChange(PatchEvent.from([unset([member.index])]))
  }, [member.index, onChange])

  const onInsert = useCallback(
    (event: {items: unknown[]; position: 'before' | 'after'}) => {
      onChange(PatchEvent.from([insert(event.items, event.position, [member.index])]))
    },
    [member.index, onChange]
  )

  const itemProps = useMemo((): PrimitiveItemProps => {
    return {
      key: member.key,
      index: member.index,
      level: member.item.level,
      value: member.item.value as FIXME,
      title: member.item.schemaType.title,
      description: member.item.schemaType.description,
      schemaType: member.item.schemaType as FIXME,
      onInsert,
      onRemove,
      presence: member.item.presence,
      validation: member.item.validation,
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
    member.item.presence,
    member.item.validation,
    member.item.readOnly,
    member.item.focused,
    member.item.id,
    member.item.path,
    onInsert,
    onRemove,
    handleFocus,
    renderedInput,
  ])

  return <>{useMemo(() => renderItem(itemProps), [itemProps, renderItem])}</>
}
