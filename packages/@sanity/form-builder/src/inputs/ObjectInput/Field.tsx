import React, {ForwardedRef, forwardRef, useCallback} from 'react'
import {resolveTypeName} from '@sanity/util/content'
import {FormFieldPresence} from '@sanity/base/presence'
import {Marker, Path, SchemaType} from '@sanity/types'
import {FormBuilderInput} from '../../FormBuilderInput'
import {InvalidValueInput} from '../InvalidValueInput'
import PatchEvent from '../../PatchEvent'
import {FormFieldSet} from '../../components/FormFieldSet'

interface FieldType {
  name: string
  type: SchemaType
}
interface FieldProps {
  field: FieldType
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
export const Field = forwardRef(function Field(props: FieldProps, forwardedRef: ForwardedRef<any>) {
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

  if (typeof value !== 'undefined') {
    const expectedType = field.type.name
    const actualType = resolveTypeName(value)
    // todo: we should consider removing this, and not allow aliasing native types
    // + ensure custom object types always gets annotated with _type
    const isCompatible = actualType === field.type.jsonType
    if (expectedType !== actualType && !isCompatible) {
      return (
        <FormFieldSet title={field.type.title} level={level} presence={presence}>
          <InvalidValueInput
            value={value}
            onChange={handleChange}
            validTypes={[field.type.name]}
            actualType={actualType}
            ref={forwardedRef}
          />
        </FormFieldSet>
      )
    }
  }
  return (
    <FormBuilderInput
      value={value}
      type={field.type}
      onChange={handleChange}
      path={[field.name]}
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
})
