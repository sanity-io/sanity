import {TextInput, type TextInputType} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {useMemo} from 'react'

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
  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCellValue(event.target.value)
  }

  const setRef = (element: HTMLInputElement) => {
    if (fieldRef) {
      fieldRef.current = element
    }
  }

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
      ref={setRef}
      __unstable_disableFocusRing
      style={{
        padding: '22px 16px',
      }}
      value={cellValue}
      data-testid={dataTestId}
      onChange={handleOnChange}
    />
  )
}
