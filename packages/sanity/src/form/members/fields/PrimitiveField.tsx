import React, {useCallback, useMemo, useRef} from 'react'
import {FieldMember} from '../../store'
import {
  PrimitiveFieldProps,
  PrimitiveInputProps,
  RenderFieldCallback,
  RenderInputCallback,
} from '../../types'
import {FormPatch, PatchEvent} from '../../patch'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {useFormCallbacks} from '../../studio/contexts/FormCallbacks'

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

  const validationError =
    useMemo(
      () =>
        member.field.validation
          .filter((item) => item.level === 'error')
          .map((item) => item.message)
          .join('\n'),
      [member.field.validation]
    ) || undefined

  const inputProps = useMemo((): PrimitiveInputProps => {
    return {
      onBlur: handleBlur,
      value: member.field.value as any,
      readOnly: member.field.readOnly,
      schemaType: member.field.schemaType as any,
      changed: member.field.changed,
      focusRef: focusRef,
      id: member.field.id,
      onFocus: handleFocus,
      path: member.field.path,
      focused: member.field.focused,
      level: member.field.level,
      onChange: handleChange,
      validation: member.field.validation,
      presence: member.field.presence,
      validationError,
    }
  }, [
    handleBlur,
    member.field.value,
    member.field.readOnly,
    member.field.schemaType,
    member.field.id,
    member.field.path,
    member.field.focused,
    member.field.level,
    member.field.validation,
    member.field.presence,
    member.field.changed,
    handleFocus,
    handleChange,
    validationError,
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
      validation: member.field.validation,
      presence: member.field.presence,
      children: renderedInput,
      changed: member.field.changed,
    }
  }, [
    member.name,
    member.index,
    member.field.level,
    member.field.value,
    member.field.schemaType,
    member.field.id,
    member.field.path,
    member.field.validation,
    member.field.presence,
    member.field.changed,
    renderedInput,
  ])

  return <>{renderField(fieldProps)}</>
}
