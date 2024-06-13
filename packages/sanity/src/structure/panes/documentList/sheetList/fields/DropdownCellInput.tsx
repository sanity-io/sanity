import {Select} from '@sanity/ui'
import {
  isNumberSchemaType,
  isStringSchemaType,
  type NumberSchemaType,
  type StringSchemaType,
  toSelectItem,
} from 'sanity'

import {type CellInputType} from '../SheetListCell'

export const shouldDropdownRender = (fieldType: StringSchemaType | NumberSchemaType) =>
  (isNumberSchemaType(fieldType) || isStringSchemaType(fieldType)) &&
  (fieldType.options?.list ||
    fieldType.options?.layout === 'radio' ||
    fieldType.options?.layout === 'dropdown')

export function DropdownCellInput({
  fieldType,
  handlePatchField,
  cellValue,
  setCellValue,
}: CellInputType<StringSchemaType | NumberSchemaType>) {
  const handleOnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value: boolean | string | number = e.target.value

    // update and patch document immediately whenever value is changed manually
    setCellValue(value)
    handlePatchField(value)
  }

  const options = fieldType.options?.list

  if (!options || typeof cellValue === 'boolean') return null

  return (
    <Select
      onChange={handleOnChange}
      radius={0}
      style={{
        boxShadow: 'none',
      }}
      value={cellValue}
    >
      {options.map(toSelectItem).map((option) => (
        <option key={option.title} value={option.value}>
          {option.title}
        </option>
      ))}
    </Select>
  )
}
