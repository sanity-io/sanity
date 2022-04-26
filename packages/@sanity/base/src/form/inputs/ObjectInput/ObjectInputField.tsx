import React, {useCallback} from 'react'
import {resolveTypeName} from '@sanity/util/content'
import {ObjectFieldType, SchemaType} from '@sanity/types'
import {FormFieldSet} from '../../components/formField'
import {PatchEvent} from '../../patch'
import {InvalidValueInput} from '../InvalidValueInput'
import {InputProps} from '../../types'

interface FieldType {
  name: string
  type: ObjectFieldType
}

export interface ObjectInputFieldProps extends Omit<InputProps, 'onChange' | 'type'> {
  // focusPath: Path
  field: FieldType
  // parent: Record<string, unknown> | undefined
  onChange: (event: PatchEvent, field: FieldType) => void
  // filterField?: (type: ObjectSchemaTypeWithOptions) => boolean
}

// This component renders a single type in an object type. It emits onChange events telling the owner about the name of the type
// that changed. This gives the owner an opportunity to use the same event handler function for all of its fields
export function ObjectInputField(props: ObjectInputFieldProps) {
  const {
    // filterField,
    // focusPath,
    // parent,
    field,
    inputProps,
    onChange,
    value,
  } = props

  const {onFocus, onBlur, readOnly, ref} = inputProps

  // const conditionalReadOnly = useConditionalReadOnly() ?? readOnly

  const handleChange = useCallback(
    (event) => {
      if (readOnly) {
        return
      }
      onChange(event, field)
    },
    [readOnly, field, onChange]
  )

  // const fieldPath = useMemo(() => [field.name], [field.name])

  const valueTypeName = resolveTypeName(value)

  const isValueCompatible =
    // undefined is always valid
    value === undefined || isAssignable(valueTypeName, field.type)

  if (!isValueCompatible) {
    return (
      <FormFieldSet onSetCollapsed={() => console.warn('todo')}>
        <InvalidValueInput
          value={value}
          onChange={handleChange}
          validTypes={[field.type.name]}
          actualType={valueTypeName}
          ref={ref}
        />
      </FormFieldSet>
    )
  }

  if (!isValueCompatible) {
    return null
  }

  return (
    <>TODO</>
    // <FormBuilderInput
    //   value={value}
    //   type={field.type}
    //   onChange={handleChange}
    //   path={fieldPath}
    //   onFocus={onFocus}
    //   onBlur={onBlur}
    //   focusPath={focusPath}
    //   // filterField={filterField}
    //   validation={validation}
    //   compareValue={compareValue}
    //   level={level}
    //   presence={presence}
    //   parent={parent}
    //   ref={forwardedRef}
    //   readOnly={conditionalReadOnly || field.type.readOnly}
    // />
  )
}

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
