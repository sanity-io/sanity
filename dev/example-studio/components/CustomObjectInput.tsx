import {FormFieldSet} from '@sanity/base/_unstable'
import {
  FieldMember,
  MemberFieldset,
  ObjectInputComponentProps,
  PatchEvent,
  setIfMissing,
} from '@sanity/base/form'
import {ObjectField, Path, ValidationMarker} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import React, {forwardRef, memo, useCallback, useImperativeHandle, useMemo, useRef} from 'react'

export const CustomObjectInput = forwardRef(function CustomObjectInput(
  props: ObjectInputComponentProps,
  ref: any
) {
  const {
    focusPath,
    level,
    members,
    onBlur,
    onChange,
    onFocus,
    presence,
    renderField,
    type,
    validation,
    value,
  } = props

  const firstFieldInputRef = useRef<{focus: () => void} | null>(null)

  const handleFieldChange = useCallback(
    (field: ObjectField, fieldPatchEvent: PatchEvent) => {
      // const {onChange, type} = props
      // Whenever the field input emits a patch event, we need to make sure to each of the included patches
      // are prefixed with its field name, e.g. going from:
      // {path: [], set: <nextvalue>} to {path: [<fieldName>], set: <nextValue>}
      // and ensure this input's value exists
      onChange(fieldPatchEvent.prefixAll(field.name).prepend(setIfMissing({_type: type.name})))
    },
    [onChange, type]
  )

  useImperativeHandle(ref, () => ({focus: () => firstFieldInputRef.current?.focus()}), [])

  return (
    <Card padding={3} radius={2} tone="primary">
      <FormFieldSet level={level + 1} title={type.title} description={type.description}>
        <Text muted size={1}>
          This is my custom object input with fields
        </Text>

        {members.map((member) => {
          if (member.type === 'field') {
            return <FieldMember key={member.key} member={member} renderField={renderField} />
          }

          return <MemberFieldset key={member.key} member={member} renderField={renderField} />
        })}

        {/* {type.fields.map((field, i) => (
          <CustomObjectField
            baseLevel={level + 1}
            basePresence={presence}
            baseValidation={validation}
            field={field}
            focusPath={focusPath || []}
            inputRef={i === 0 ? firstFieldInputRef : null}
            key={field.name}
            onBlur={onBlur}
            onChange={handleFieldChange}
            onFocus={onFocus}
            value={value?.[field.name]}
          />
        ))} */}
      </FormFieldSet>
    </Card>
  )
})

const CustomObjectField = memo(function CustomObjectField(props: {
  baseLevel: number
  basePresence: any[]
  baseValidation: ValidationMarker[]
  field: ObjectField
  focusPath: Path
  inputRef: React.Ref<{focus: () => void}>
  onBlur?: () => void
  onChange: (field: ObjectField, fieldPatchEvent: PatchEvent) => void
  onFocus: (pathOrEvent?: Path | React.FocusEvent) => void
  value: unknown
}) {
  const {
    baseLevel,
    basePresence,
    baseValidation,
    field,
    focusPath,
    inputRef,
    onBlur,
    onChange,
    onFocus,
    value,
  } = props

  const path = useMemo(() => [field.name], [field])

  const presence = useMemo(
    () => basePresence.filter((m) => m.path[0] === field.name),
    [basePresence, field]
  )

  const validation = useMemo(
    () => baseValidation.filter((m) => m.path[0] === field.name),
    [baseValidation, field]
  )

  const handleChange = useCallback(
    (patchEvent) => {
      onChange(field, patchEvent)
    },
    [field, onChange]
  )

  return (
    // Delegate to the generic FormBuilderInput. It will resolve and insert the actual input component
    // for the given field type
    <FormBuilderInput
      level={baseLevel + 1}
      ref={inputRef}
      type={field.type}
      value={value}
      onChange={handleChange}
      path={path}
      focusPath={focusPath}
      onFocus={onFocus}
      onBlur={onBlur}
      presence={presence}
      validation={validation}
    />
  )
})
