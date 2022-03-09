import {isReferenceSchemaType, Marker, Path, SchemaType} from '@sanity/types'
import React, {ForwardedRef, forwardRef, useMemo} from 'react'
import {FormFieldPresence} from '@sanity/base/presence'
import {FormBuilderInput} from '../../../../FormBuilderInput'
import {ArrayMember, InsertEvent, ReferenceItemComponentType} from '../types'
import PatchEvent from '../../../../PatchEvent'
import {FormBuilderFilterFieldFn, FormInputProps as InputProps} from '../../../../types'

type Props = {
  type: SchemaType
  value: ArrayMember
  compareValue?: ArrayMember[]
  onInsert?: (event: InsertEvent) => void
  markers: Marker[]
  onChange: (event: PatchEvent) => void
  onFocus: (path: Path) => void
  insertableTypes?: SchemaType[]
  ReferenceItemComponent: ReferenceItemComponentType
  onBlur: () => void
  filterField: FormBuilderFilterFieldFn
  isSortable: boolean
  readOnly: boolean | null
  focusPath: Path
  presence: FormFieldPresence[]
}

export const ItemForm = forwardRef(function ItemForm(props: Props, ref: ForwardedRef<any>) {
  const {
    type,
    value,
    markers,
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
            givenProps: InputProps,
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
      markers={markers}
      path={[{_key: value._key}]}
      filterField={filterField}
      presence={presence}
      ref={ref}
    />
  )
})
