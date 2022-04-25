import React, {ForwardedRef, forwardRef, useCallback, useMemo} from 'react'
import {resolveTypeName} from '@sanity/util/content'
import {ObjectFieldType, ObjectSchemaTypeWithOptions, SchemaType} from '@sanity/types'
import {FormFieldSet} from '../../../components/formField'
import {PatchEvent} from '../../patch'
import {FormBuilderInput} from '../../FormBuilderInput'
import {InvalidValueInput} from '../InvalidValueInput'
import {ConditionalHiddenField} from '../common/ConditionalHiddenField'
import {useConditionalReadOnly} from '../../../conditional-property/conditionalReadOnly'
import {FieldProps} from '../../store/types'

interface FieldType {
  name: string
  type: ObjectFieldType
}

export interface ObjectInputFieldProps extends Omit<FieldProps, 'onChange' | 'type'> {
  field: FieldType
  parent: Record<string, unknown> | undefined
  onChange: (event: PatchEvent, field: FieldType) => void
  filterField?: (type: ObjectSchemaTypeWithOptions) => boolean
}

// This component renders a single type in an object type. It emits onChange events telling the owner about the name of the type
// that changed. This gives the owner an opportunity to use the same event handler function for all of its fields
export const ObjectInputField = forwardRef(function ObjectInputField(
  props: ObjectInputFieldProps,
  forwardedRef: ForwardedRef<any>
) {
  const {
    value,
    field,
    level,
    onChange,
    onFocus,
    onBlur,
    validation,
    focusPath,
    filterField,
    compareValue,
    presence,
    parent,
    readOnly,
  } = props
  const conditionalReadOnly = useConditionalReadOnly() ?? readOnly

  const handleChange = useCallback(
    (event) => {
      const isReadOnly = conditionalReadOnly ?? field.type.readOnly
      if (typeof isReadOnly === 'boolean' && isReadOnly) {
        return
      }
      onChange(event, field)
    },
    [conditionalReadOnly, field, onChange]
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
        focusPath={focusPath}
        // filterField={filterField}
        validation={validation}
        compareValue={compareValue}
        level={level}
        presence={presence}
        parent={parent}
        ref={forwardedRef}
        readOnly={conditionalReadOnly || field.type.readOnly}
      />
    )
  }, [
    isValueCompatible,
    value,
    field.type,
    handleChange,
    fieldPath,
    onFocus,
    onBlur,
    focusPath,
    filterField,
    validation,
    compareValue,
    level,
    presence,
    parent,
    forwardedRef,
    conditionalReadOnly,
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
    <ConditionalHiddenField parent={props.parent} value={value} hidden={field.type.hidden}>
      {children}
    </ConditionalHiddenField>
  )
})

/**
 * Check whether the given value type is assignable to the given schema type
 */
function isAssignable(
  /**
   * The resolved value type name
   */
  valueTypeName: string,
  /**
   * The schema type
   */
  schemaType: SchemaType
) {
  return (
    valueTypeName === schemaType.name ||
    // todo: we should consider removing this check, and not allow aliasing native type and
    //  ensure custom object types always gets annotated with _type
    valueTypeName === schemaType.jsonType
  )
}
