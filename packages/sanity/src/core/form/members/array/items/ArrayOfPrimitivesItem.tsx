import {isBooleanSchemaType, isNumberSchemaType, SchemaType} from '@sanity/types'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {FIXME} from '../../../../FIXME'
import {ArrayOfPrimitivesItemMember} from '../../../store'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {getEmptyValue} from '../../../inputs/arrays/ArrayOfPrimitivesInput/getEmptyValue'
import {
  PrimitiveInputProps,
  PrimitiveItemProps,
  RenderArrayOfPrimitivesItemCallback,
  RenderInputCallback,
} from '../../../types'
import {insert, PatchArg, PatchEvent, set, unset} from '../../../patch'
import {useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {resolveNativeNumberInputValue} from '../../common/resolveNativeNumberInputValue'
import {createDescriptionId} from '../../common/createDescriptionId'

/**
 *
 * @hidden
 * @beta
 */
export interface PrimitiveMemberItemProps {
  member: ArrayOfPrimitivesItemMember
  renderItem: RenderArrayOfPrimitivesItemCallback
  renderInput: RenderInputCallback
}

/**
 *
 * @hidden
 * @beta
 */
export function ArrayOfPrimitivesItem(props: PrimitiveMemberItemProps) {
  const focusRef = useRef<{focus: () => void}>()
  const {member, renderItem, renderInput} = props

  const [localValue, setLocalValue] = useState<undefined | string>()

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
    [member.item.path, onPathBlur],
  )

  const handleFocus = useCallback(
    (event: React.FocusEvent) => {
      onPathFocus(member.item.path)
    },
    [member.item.path, onPathFocus],
  )

  const handleChange = useCallback(
    (event: PatchEvent | PatchArg) => {
      onChange(PatchEvent.from(event).prefixAll(member.index))
    },
    [onChange, member.index],
  )
  const handleNativeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue: number | string | boolean = event.currentTarget.value
      if (isNumberSchemaType(member.item.schemaType)) {
        inputValue = event.currentTarget.valueAsNumber
        if (inputValue > Number.MAX_SAFE_INTEGER || inputValue < Number.MIN_SAFE_INTEGER) {
          return
        }
      } else if (isBooleanSchemaType(member.item.schemaType)) {
        inputValue = event.currentTarget.checked
      }

      // `valueAsNumber` returns `NaN` on empty input
      const hasEmptyValue =
        inputValue === '' || (typeof inputValue === 'number' && isNaN(inputValue))

      if (isNumberSchemaType(member.item.schemaType)) {
        // Store the local value for number inputs in order to support intermediate values
        // that includes more information than the numeric value
        // E.g. if typing `0.0` the numeric value will be 0, but we still want to show `0.0` in the input to allow typing
        // more digits
        setLocalValue(hasEmptyValue ? undefined : event.currentTarget.value)
      }

      handleChange(
        set(
          hasEmptyValue
            ? // Map direct unset patches to empty value instead in order to not *remove* elements as the user clears out the value
              // note: this creates the rather curious case where the input renders ´0´ when you try to clear it.
              getEmptyValue(member.item.schemaType)
            : inputValue,
        ),
      )
    },
    [handleChange, member.item.schemaType],
  )

  const elementProps = useMemo(
    (): PrimitiveInputProps['elementProps'] => ({
      onBlur: handleBlur,
      onFocus: handleFocus,
      id: member.item.id,
      ref: focusRef,
      onChange: handleNativeChange,
      value: resolveNativeInputValue(member.item.schemaType, member.item.value, localValue),
      readOnly: Boolean(member.item.readOnly),
      placeholder: member.item.schemaType.placeholder,
      'aria-describedby': createDescriptionId(member.item.id, member.item.schemaType.description),
    }),
    [
      handleBlur,
      handleFocus,
      handleNativeChange,
      member.item.id,
      member.item.readOnly,
      member.item.schemaType,
      member.item.value,
      localValue,
    ],
  )
  const inputProps = useMemo((): Omit<PrimitiveInputProps, 'renderDefault'> => {
    return {
      changed: member.item.changed,
      level: member.item.level,
      value: member.item.value as FIXME,
      readOnly: member.item.readOnly,
      schemaType: member.item.schemaType as FIXME,
      id: member.item.id,
      path: member.item.path,
      focused: member.item.focused,
      onChange: handleChange,
      validation: member.item.validation,
      presence: member.item.presence,
      elementProps,
    }
  }, [
    member.item.changed,
    member.item.level,
    member.item.value,
    member.item.readOnly,
    member.item.schemaType,
    member.item.id,
    member.item.path,
    member.item.focused,
    member.item.validation,
    member.item.presence,
    handleChange,
    elementProps,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const onRemove = useCallback(() => {
    onChange(PatchEvent.from([unset([member.index])]))
  }, [member.index, onChange])

  const onInsert = useCallback(
    (event: {items: unknown[]; position: 'before' | 'after'}) => {
      onChange(PatchEvent.from([insert(event.items, event.position, [member.index])]))
    },
    [member.index, onChange],
  )

  const itemProps = useMemo((): Omit<PrimitiveItemProps, 'renderDefault'> => {
    return {
      key: member.key,
      index: member.index,
      level: member.item.level,
      value: member.item.value as FIXME,
      title: member.item.schemaType.title,
      description: member.item.schemaType.description,
      schemaType: member.item.schemaType as FIXME,
      parentSchemaType: member.parentSchemaType,
      onInsert,
      onRemove,
      presence: member.item.presence,
      validation: member.item.validation,
      readOnly: member.item.readOnly,
      focused: member.item.focused,
      onFocus: handleFocus,
      onBlur: handleBlur,
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
    member.parentSchemaType,
    onInsert,
    onRemove,
    handleFocus,
    handleBlur,
    renderedInput,
  ])

  return <>{useMemo(() => renderItem(itemProps as PrimitiveItemProps), [itemProps, renderItem])}</>
}

function resolveNativeInputValue(
  schemaType: SchemaType,
  value: unknown,
  localValue: string | undefined,
): string {
  // this is a trick to retain type information while displaying an "empty" input
  // if this input is used to edit items in an array of numbers, the value can't really be set to empty without
  // either removing the item or losing type information (i.e. it can't be an empty string, because that's… a string)
  // so the array of numbers then use the special value `-0` to represent an empty value
  if (Object.is(value, -0)) {
    return ''
  }
  return resolveNativeNumberInputValue(schemaType, value, localValue)
}
