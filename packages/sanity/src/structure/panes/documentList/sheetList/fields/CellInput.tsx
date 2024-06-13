import {TextInput, type TextInputType} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {useCallback, useMemo} from 'react'

import {type DocumentSheetTableRow} from '../types'

export const CellInput = ({
  cellValue,
  setCellValue,
  fieldRef,
  column,
  getOnMouseDownHandler,
  'data-testid': dataTestId,
}: CellContext<DocumentSheetTableRow, unknown>) => {
  const {fieldType} = column.columnDef.meta || {}
  const value = cellValue as string
  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCellValue(event.target.value)
    },
    [setCellValue],
  )

  const handleOnMouseDown = useMemo(
    () => getOnMouseDownHandler(fieldType?.name !== 'number'),
    [fieldType?.name, getOnMouseDownHandler],
  )

  const inputType = (fieldType?.name !== 'string' && (fieldType?.name as TextInputType)) || 'text'

  return (
    <TextInput
      size={0}
      radius={0}
      border={false}
      type={inputType}
      onMouseDown={handleOnMouseDown}
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
