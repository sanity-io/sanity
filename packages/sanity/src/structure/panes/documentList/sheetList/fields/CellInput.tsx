import {type NumberSchemaType, type StringSchemaType} from '@sanity/types'
import {TextInput, type TextInputType} from '@sanity/ui'
import {useCallback, useEffect} from 'react'

import {type CellInputType} from '../SheetListCell'

export const CellInput = ({
  cellValue,
  setCellValue,
  fieldRef,
  column,
  setShouldPreventDefaultMouseDown,
  'data-testid': dataTestId,
}: CellInputType<StringSchemaType | NumberSchemaType>) => {
  const {fieldType} = column.columnDef.meta || {}
  const value = cellValue as string
  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCellValue(event.target.value)
    },
    [setCellValue],
  )

  useEffect(() => {
    if (fieldType?.name !== 'number') setShouldPreventDefaultMouseDown(true)
  }, [fieldType?.name, setShouldPreventDefaultMouseDown])

  const inputType = (fieldType?.name !== 'string' && (fieldType?.name as TextInputType)) || 'text'

  return (
    <TextInput
      size={0}
      radius={0}
      border={false}
      type={inputType}
      ref={fieldRef}
      __unstable_disableFocusRing
      style={{
        padding: '22px 16px',
      }}
      value={value}
      data-testid={dataTestId}
      onChange={handleOnChange}
    />
  )
}
