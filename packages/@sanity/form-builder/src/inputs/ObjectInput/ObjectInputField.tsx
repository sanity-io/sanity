import React, {ForwardedRef, forwardRef, useCallback, useMemo} from 'react'
import {FormFieldSet} from '@sanity/base/components'
import {resolveTypeName} from '@sanity/util/content'
import {FormFieldPresence} from '@sanity/base/presence'
import {Marker, Path, SchemaType} from '@sanity/types'
import {FormBuilderInput} from '../../FormBuilderInput'
import {InvalidValueInput} from '../InvalidValueInput'
import PatchEvent from '../../PatchEvent'
import {ConditionalField} from './ConditionalField'

interface FieldType {
  name: string
  type: SchemaType
}
interface FieldProps {
  field: FieldType
  parent: Record<string, unknown> | undefined
  value: unknown
  compareValue: unknown
  onChange: (event: PatchEvent, field: FieldType) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  focusPath?: Path
  filterField?: (type: SchemaType) => boolean
  readOnly?: boolean
  markers?: Marker[]
  level: number
  presence?: FormFieldPresence[]
}
// This component renders a single type in an object type. It emits onChange events telling the owner about the name of the type
// that changed. This gives the owner an opportunity to use the same event handler function for all of its fields
export const ObjectInputField = forwardRef(function ObjectInputField(
  props: FieldProps,
  forwardedRef: ForwardedRef<any>
) {
  const {
    value,
    readOnly,
    field,
    level,
    onChange,
    onFocus,
    onBlur,
    markers,
    focusPath,
    filterField,
    compareValue,
    presence,
  } = props

  const handleChange = useCallback(
    (event) => {
      if (!field.type.readOnly) {
        onChange(event, field)
      }
    },
    [onChange, field]
  )

  const fieldPath = useMemo(() => [field.name], [field.name])

  const valueTypeName = resolveTypeName(value)

  const isValueCompatible =
    // undefined is always valid
    value === undefined || isAssignable(valueTypeName, field.type)

  const children = useMemo(() => {
    if (!isValueCompatible) {
      return null
    }
    return (
      <FormBuilderInput
        value={value}
        type={field.type}
        onChange={handleChange}
        path={fieldPath}
        onFocus={onFocus}
        onBlur={onBlur}
        readOnly={readOnly || field.type.readOnly}
        focusPath={focusPath}
        filterField={filterField}
        markers={markers}
        compareValue={compareValue}
        level={level}
        presence={presence}
        ref={forwardedRef}
      />
    )
  }, [
    isValueCompatible,
    compareValue,
    field.type,
    fieldPath,
    filterField,
    focusPath,
    forwardedRef,
    handleChange,
    level,
    markers,
    onBlur,
    onFocus,
    presence,
    readOnly,
    value,
  ])

  if (!isValueCompatible) {
    return (
      <FormFieldSet title={field.type.title} level={level} __unstable_presence={presence}>
        <InvalidValueInput
          value={value}
          onChange={handleChange}
          validTypes={[field.type.name]}
          actualType={valueTypeName}
          ref={forwardedRef}
        />
      </FormFieldSet>
    )
  }

  return (
    <ConditionalField parent={props.parent} value={value} hidden={field.type.hidden}>
      {children}
    </ConditionalField>
  )
})

/**
 * Check whether the given value type is assignable to the given schema type
 * @param valueTypeName The resolved value type name
 * @param schemaType The schema type
 */
function isAssignable(valueTypeName: string, schemaType: SchemaType) {
  return (
    valueTypeName === schemaType.name ||
    // todo: we should consider removing this check, and not allow aliasing native type and
    //  ensure custom object types always gets annotated with _type
    valueTypeName === schemaType.jsonType
  )
}
