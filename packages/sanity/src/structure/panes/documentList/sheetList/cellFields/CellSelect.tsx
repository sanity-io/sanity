import {type BooleanSchemaType, type NumberSchemaType, type StringSchemaType} from '@sanity/types'
import {Select} from '@sanity/ui'
import {
  isBooleanSchemaType,
  isNumberSchemaType,
  isStringSchemaType,
  type TitledListValue,
  toSelectItem,
} from 'sanity'

import {type CellState} from '../DocumentSheetListProvider'
import {useSheetListCell} from '../SheetListCell'

type Props = {
  fieldType: BooleanSchemaType | StringSchemaType | NumberSchemaType
  patchDocument: (value: any) => void
  onCellValueChange: (value: any) => void
  cellValue: string | number
  cellState: CellState
}

export default function CellSelect({
  fieldType,
  cellState,
  patchDocument,
  cellValue,
  onCellValueChange: handleCellValueChange,
}: Props) {
  const parsePasteValue = (clipboardData: string | undefined) => {
    console.log({
      bool: isBooleanSchemaType(fieldType),
      num: isNumberSchemaType(fieldType),
      str: isStringSchemaType(fieldType),
    })
    if (isBooleanSchemaType(fieldType)) {
      return clipboardData === 'true'
    }

    if (isNumberSchemaType(fieldType)) {
      return Number(clipboardData)
    }

    return String(clipboardData)
  }

  useSheetListCell(cellState, cellValue, handleCellValueChange, patchDocument, parsePasteValue)

  const handleOnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let value: boolean | string | number = e.target.value
    if (isBooleanSchemaType(fieldType)) {
      value = value === 'true'
    }
    // update and patch document immediately whenever value is changed manually
    handleCellValueChange(value)
    patchDocument?.(value)
  }

  if (
    !(
      isBooleanSchemaType(fieldType) ||
      isNumberSchemaType(fieldType) ||
      isStringSchemaType(fieldType)
    )
  )
    return null

  if (
    isBooleanSchemaType(fieldType) ||
    fieldType.options?.list ||
    fieldType.options?.layout === 'radio' ||
    fieldType.options?.layout === 'dropdown' ||
    fieldType.options?.layout === 'checkbox' ||
    fieldType.options?.layout === 'switch'
  ) {
    const options = isBooleanSchemaType(fieldType)
      ? ([
          {title: 'True', value: 'true'},
          {title: 'False', value: 'false'},
        ] as Array<TitledListValue<string>>)
      : fieldType.options?.list

    if (!options) return null

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
}
