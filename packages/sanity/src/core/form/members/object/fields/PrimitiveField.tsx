import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {isBooleanSchemaType, isNumberSchemaType} from '@sanity/types'
import {FieldMember} from '../../../store'
import {
  PrimitiveFieldProps,
  PrimitiveInputProps,
  RenderFieldCallback,
  RenderInputCallback,
} from '../../../types'
import {FormPatch, PatchEvent, set, unset} from '../../../patch'
import {useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {resolveNativeNumberInputValue} from '../../common/resolveNativeNumberInputValue'
import {useDocumentFieldActions} from '../../../studio/contexts/DocumentFieldActions'
import {createDescriptionId} from '../../common/createDescriptionId'

/**
 * Responsible for creating inputProps and fieldProps to pass to ´renderInput´ and ´renderField´ for a primitive field/input
 * @param props - Component props
 *
 * @internal
 */
export function PrimitiveField(props: {
  member: FieldMember
  renderInput: RenderInputCallback<PrimitiveInputProps>
  renderField: RenderFieldCallback<PrimitiveFieldProps>
}) {
  const {member, renderInput, renderField} = props

  const fieldActions = useDocumentFieldActions()

  const focusRef = useRef<{focus: () => void}>()

  const [localValue, setLocalValue] = useState<string | undefined>()

  const {onPathBlur, onPathFocus, onChange} = useFormCallbacks()

  useEffect(() => {
    if (member.field.focused) {
      focusRef.current?.focus()
    }
  }, [member.field.focused])

  const handleBlur = useCallback(() => {
    onPathBlur(member.field.path)
  }, [member.field.path, onPathBlur])

  const handleFocus = useCallback(() => {
    onPathFocus(member.field.path)
  }, [member.field.path, onPathFocus])

  const handleChange = useCallback(
    (event: FormPatch | FormPatch[] | PatchEvent) => {
      onChange(PatchEvent.from(event).prefixAll(member.name))
    },
    [onChange, member.name]
  )

  const handleNativeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue: number | string | boolean = event.currentTarget.value
      if (isNumberSchemaType(member.field.schemaType)) {
        inputValue = event.currentTarget.valueAsNumber
        if (inputValue > Number.MAX_SAFE_INTEGER || inputValue < Number.MIN_SAFE_INTEGER) {
          return
        }
      } else if (isBooleanSchemaType(member.field.schemaType)) {
        inputValue = event.currentTarget.checked
      }

      // `valueAsNumber` returns `NaN` on empty input
      const hasEmptyValue =
        inputValue === '' || (typeof inputValue === 'number' && isNaN(inputValue))

      if (isNumberSchemaType(member.field.schemaType)) {
        // Store the local value for number inputs in order to support intermediate values
        // that includes more information than the numeric value
        // E.g. if typing `0.0` the numeric value will be 0, but we still want to show `0.0` in the input to allow typing
        // more digits
        setLocalValue(hasEmptyValue ? undefined : event.currentTarget.value)
      }

      onChange(PatchEvent.from(hasEmptyValue ? unset() : set(inputValue)).prefixAll(member.name))
    },
    [member.name, member.field.schemaType, onChange]
  )

  const validationError =
    useMemo(
      () =>
        member.field.validation
          .filter((item) => item.level === 'error')
          .map((item) => item.message)
          .join('\n'),
      [member.field.validation]
    ) || undefined

  const elementProps = useMemo(
    (): PrimitiveInputProps['elementProps'] => ({
      onBlur: handleBlur,
      onFocus: handleFocus,
      id: member.field.id,
      ref: focusRef,
      onChange: handleNativeChange,
      value: resolveNativeNumberInputValue(member.field.schemaType, member.field.value, localValue),
      readOnly: Boolean(member.field.readOnly),
      placeholder: member.field.schemaType.placeholder,
      'aria-describedby': createDescriptionId(member.field.id, member.field.schemaType.description),
    }),
    [
      handleBlur,
      handleFocus,
      handleNativeChange,
      member.field.id,
      member.field.readOnly,
      member.field.schemaType,
      member.field.value,
      localValue,
    ]
  )

  const inputProps = useMemo((): Omit<PrimitiveInputProps, 'renderDefault'> => {
    return {
      value: member.field.value as any,
      readOnly: member.field.readOnly,
      schemaType: member.field.schemaType as any,
      changed: member.field.changed,
      id: member.field.id,
      path: member.field.path,
      focused: member.field.focused,
      level: member.field.level,
      onChange: handleChange,
      validation: member.field.validation,
      presence: member.field.presence,
      validationError,
      elementProps,
    }
  }, [
    member.field.value,
    member.field.readOnly,
    member.field.schemaType,
    member.field.changed,
    member.field.id,
    member.field.path,
    member.field.focused,
    member.field.level,
    member.field.validation,
    member.field.presence,
    handleChange,
    validationError,
    elementProps,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const fieldProps = useMemo((): Omit<PrimitiveFieldProps, 'renderDefault'> => {
    return {
      actions: fieldActions,
      changed: member.field.changed,
      children: renderedInput,
      description: member.field.schemaType.description,
      index: member.index,
      inputId: member.field.id,
      inputProps: inputProps as any,
      level: member.field.level,
      name: member.name,
      path: member.field.path,
      presence: member.field.presence,
      schemaType: member.field.schemaType as any,
      title: member.field.schemaType.title,
      validation: member.field.validation,
      value: member.field.value as any,
    }
  }, [
    fieldActions,
    member.field.level,
    member.field.value,
    member.field.schemaType,
    member.field.id,
    member.field.path,
    member.field.validation,
    member.field.presence,
    member.field.changed,
    member.name,
    member.index,
    renderedInput,
    inputProps,
  ])

  return <>{renderField(fieldProps)}</>
}
