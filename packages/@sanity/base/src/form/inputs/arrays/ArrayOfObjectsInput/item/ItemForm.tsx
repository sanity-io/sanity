import {isReferenceSchemaType, SchemaType} from '@sanity/types'
import React, {ForwardedRef, forwardRef, useMemo} from 'react'
import {FormBuilderFilterFieldFn} from '../../../../types'
import {FormBuilderInput} from '../../../../FormBuilderInput'
import {ArrayMember, InsertEvent, ReferenceItemComponentType} from '../types'
import {ArrayFieldProps, FieldProps} from '../../../../store/types'

interface ItemFormProps extends Omit<ArrayFieldProps<ArrayMember>, 'level' | 'value'> {
  onInsert?: (event: InsertEvent) => void
  insertableTypes?: SchemaType[]
  ReferenceItemComponent: ReferenceItemComponentType
  filterField: FormBuilderFilterFieldFn
  isSortable: boolean
  value: ArrayMember
}

export const ItemForm = forwardRef(function ItemForm(props: ItemFormProps, ref: ForwardedRef<any>) {
  const {
    type,
    value,
    validation,
    focusPath,
    onFocus,
    onBlur,
    onChange,
    ReferenceItemComponent,
    insertableTypes,
    readOnly,
    isSortable,
    filterField,
    presence,
    onInsert,
    compareValue,
  } = props

  const isReference = isReferenceSchemaType(type)

  const Input = useMemo(
    () =>
      isReference
        ? forwardRef(function Input_(
            givenProps: FieldProps,
            inputRef: ForwardedRef<{focus: () => void}>
          ) {
            return (
              <ReferenceItemComponent
                {...givenProps}
                insertableTypes={insertableTypes}
                onInsert={onInsert}
                isSortable={isSortable}
                onChange={onChange}
                ref={inputRef}
              />
            )
          })
        : undefined,
    [ReferenceItemComponent, insertableTypes, isReference, isSortable, onInsert, onChange]
  )

  const path = useMemo(() => [{_key: value?._key}], [value?._key])

  return (
    <FormBuilderInput
      type={type}
      level={0}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      inputComponent={Input}
      compareValue={compareValue}
      focusPath={focusPath}
      readOnly={readOnly || type.readOnly || false}
      validation={validation}
      path={path}
      // filterField={filterField}
      presence={presence}
      ref={ref}
    />
  )
})
