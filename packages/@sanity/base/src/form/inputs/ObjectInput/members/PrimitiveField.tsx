import React, {useCallback, useMemo, useRef} from 'react'
import {isEqual, startsWith} from '@sanity/util/paths'
import {isValidationErrorMarker} from '@sanity/types'
import {FieldMember} from '../../../store/types/members'
import {PrimitiveInputProps, RenderFieldCallback, RenderInputCallback} from '../../../types'
import {PrimitiveFieldProps} from '../../../types/fieldProps'
import {useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {FormPatch, PatchEvent} from '../../../patch'
import {useValidationMarkers} from '../../../studio/contexts/Validation'
import {useFormFieldPresence} from '../../../studio/contexts/Presence'

/**
 * Responsible for creating inputProps and fieldProps to pass to ´renderInput´ and ´renderField´ for a primitive field/input
 * @param props - Component props
 */
export function PrimitiveField(props: {
  member: FieldMember
  renderInput: RenderInputCallback<PrimitiveInputProps>
  renderField: RenderFieldCallback<PrimitiveFieldProps>
}) {
  const {member, renderInput, renderField} = props
  const focusRef = useRef<{focus: () => void}>()

  const {onPathBlur, onPathFocus, onChange} = useFormCallbacks()
  const rootValidation = useValidationMarkers()
  const rootPresence = useFormFieldPresence()

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
    (event: FormPatch | FormPatch[] | PatchEvent) => {
      onChange(PatchEvent.from(event).prefixAll(member.name))
    },
    [onChange, member.name]
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

  const customValidity = useMemo(
    () =>
      validation
        .filter(isValidationErrorMarker)
        .map((v) => v.item.message)
        .join(''),
    [validation]
  )

  const inputProps = useMemo((): PrimitiveInputProps => {
    return {
      onBlur: handleBlur,
      value: member.field.value as any,
      readOnly: member.field.readOnly,
      schemaType: member.field.schemaType as any,
      compareValue: member.field.compareValue as any,
      focusRef: focusRef,
      id: member.field.id,
      onFocus: handleFocus,
      path: member.field.path,
      focused: member.field.focused,
      level: member.field.level,
      onChange: handleChange,
      validation,
      presence,
      customValidity,
    }
  }, [
    handleBlur,
    member.field.value,
    member.field.readOnly,
    member.field.schemaType,
    member.field.compareValue,
    member.field.id,
    member.field.path,
    member.field.focused,
    member.field.level,
    handleFocus,
    handleChange,
    validation,
    presence,
    customValidity,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const fieldProps = useMemo((): PrimitiveFieldProps => {
    return {
      name: member.name,
      index: member.index,
      level: member.field.level,
      value: member.field.value as any,
      schemaType: member.field.schemaType as any,
      title: member.field.schemaType.title,
      description: member.field.schemaType.description,
      inputId: member.field.id,
      path: member.field.path,
      validation,
      presence,
      children: renderedInput,
    }
  }, [
    member.field.level,
    member.field.value,
    member.field.schemaType,
    member.field.id,
    validation,
    presence,
    member.field.path,
    member.index,
    member.name,
    renderedInput,
  ])

  return <>{renderField(fieldProps)}</>
}
