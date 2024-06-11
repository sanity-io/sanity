import {
  type BooleanSchemaType,
  isBooleanSchemaType,
  isNumberSchemaType,
  type NumberSchemaType,
  type StringSchemaType,
} from '@sanity/types'
import {type Cell, flexRender} from '@tanstack/react-table'
import {useCallback, useEffect, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {useDocumentSheetListContext} from './DocumentSheetListProvider'
import {type DocumentSheetTableRow} from './types'

const DataCell = styled.td<{width: number}>`
  display: flex;
  align-items: center;
  overflow: hidden;
  box-sizing: border-box;
  width: ${({width}) => width}px;
  background-color: var(--card-bg-color);
`

const PinnedDataCell = styled(DataCell)`
  position: sticky;
  z-index: 2;
`

const getFieldValueAsFieldType = (
  providedValue: any,
  fieldType: BooleanSchemaType | StringSchemaType | NumberSchemaType,
) => {
  if (isBooleanSchemaType(fieldType)) {
    return providedValue === 'true'
  }
  if (isNumberSchemaType(fieldType)) {
    return parseFloat(providedValue)
  }

  return String(providedValue)
}

/** @internal */
export function SheetListCell(cell: Cell<DocumentSheetTableRow, unknown>) {
  const isPinned = cell.column.getIsPinned()
  const {column, row, getValue, getContext} = cell
  const {fieldType} = column.columnDef.meta || {}
  const cellContext = getContext()
  const cellId = `cell-${column.id}-${row.index}`
  const providedValueRef = useRef(getValue())
  const [cellValue, setCellValue] = useState<string | number>(getValue() as string)
  const fieldRef = useRef<HTMLElement | null>(null)
  const Cell = isPinned ? PinnedDataCell : DataCell
  const {
    focusAnchorCell,
    resetFocusSelection,
    setSelectedAnchorCell,
    getStateByCellId,
    submitFocusedCell,
  } = useDocumentSheetListContext()

  const cellState = getStateByCellId(cell.column.id, cell.row.index)
  const {patchDocument, unsetDocumentValue} = cellContext.table.options.meta || {}

  const _patchDocument = useCallback(
    (value: any) => {
      if (!fieldType) return

      const typedValue = getFieldValueAsFieldType(value, fieldType)

      patchDocument?.(row.original.__metadata.idPair.publishedId, column.id, typedValue)
    },
    [column.id, fieldType, patchDocument, row.original.__metadata.idPair.publishedId],
  )

  const getStateStyles = () => {
    if (cellState) {
      return {
        border: '1px solid var(--card-focus-ring-color)',
        boxShadow:
          cellState === 'focused'
            ? 'inset 0px 0px 0px 1px var(--card-focus-ring-color)'
            : undefined,
      }
    }

    return {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'var(--card-border-color) var(--card-border-color) transparent transparent',
    }
  }

  const handleOnKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const {key} = event

      switch (key) {
        case 'Enter': {
          if (cellState === 'selectedAnchor') handleProgrammaticFocus()
          if (cellState === 'focused') submitFocusedCell()
          break
        }
        case 'Escape': {
          if (cellState === 'focused') {
            setCellValue(providedValueRef.current as string)

            // wait for state to settle before blurring
            setTimeout(() => setSelectedAnchorCell(column.id, row.index))
          }
          break
        }

        case 'Delete':
        case 'Backspace': {
          if (cellState !== 'focused') {
            setCellValue('')
            unsetDocumentValue?.(row.original.__metadata.idPair.publishedId, column.id)
          }
          break
        }

        default:
          break
      }
    },
    [
      cellState,
      column.id,
      row.index,
      row.original.__metadata.idPair.publishedId,
      setSelectedAnchorCell,
      submitFocusedCell,
      unsetDocumentValue,
    ],
  )

  const handleProgrammaticFocus = () => {
    fieldRef.current?.focus()
    if (fieldRef.current instanceof HTMLInputElement) {
      fieldRef.current.select()
    }
  }

  const handleOnFocus = useCallback(() => {
    // reselect in cases where focus achieved without initial mousedown
    setSelectedAnchorCell(column.id, row.index)
    focusAnchorCell()
  }, [column.id, focusAnchorCell, row.index, setSelectedAnchorCell])

  const handleOnBlur = useCallback(() => {
    if (cellValue !== providedValueRef.current) {
      _patchDocument(cellValue)
    }
    resetFocusSelection()
  }, [_patchDocument, cellValue, resetFocusSelection])

  // child field inputs can control whether default behavior is stopped or preserved
  const getOnMouseDownHandler = useCallback(
    (shouldStopDefault: boolean) => (event: React.MouseEvent<HTMLElement>) => {
      if (event.detail === 2) {
        handleProgrammaticFocus()
      } else {
        if (shouldStopDefault) event.preventDefault()
        setSelectedAnchorCell(column.id, row.index)
      }
    },
    [column.id, row.index, setSelectedAnchorCell],
  )

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData?.getData('Text')
      if (!clipboardData || !fieldType) return

      const typedValue = getFieldValueAsFieldType(clipboardData, fieldType)
      setCellValue(clipboardData)
      // patch immediately when pasting
      _patchDocument(typedValue)
    },
    [_patchDocument, fieldType],
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cellValue.toString())
  }, [cellValue])

  useEffect(() => {
    if (cellState)
      // only listen for key when cell is selected or focused
      document.addEventListener('keydown', handleOnKeyDown)
    if (cellState === 'selectedAnchor' || cellState === 'selectedRange')
      // if cell is selected, paste events should be handled
      document.addEventListener('paste', handlePaste)

    if (cellState === 'selectedAnchor')
      // only allow copying when cell is selected anchor
      document.addEventListener('copy', handleCopy)

    return () => {
      if (cellState) document.removeEventListener('keydown', handleOnKeyDown)
      if (cellState === 'selectedAnchor' || cellState === 'selectedRange')
        document.removeEventListener('paste', handlePaste)
      if (cellState === 'selectedAnchor') document.removeEventListener('copy', handleCopy)
    }
  }, [cellState, handleCopy, handleOnKeyDown, handlePaste])

  // Keep value of cell up to date with external changes
  useEffect(() => {
    const realTimeValue = getValue()

    if (providedValueRef?.current !== realTimeValue) {
      if (providedValueRef.current === cellValue) {
        // do not update the value if it's currently being edited
        setCellValue(realTimeValue as string)
      }
      providedValueRef.current = realTimeValue
    }
  }, [getValue, cellValue])

  const cellProps = {
    'onFocus': handleOnFocus,
    'onBlur': handleOnBlur,
    'aria-selected': !!cellState,
    'id': cellId,
    'data-testid': cellId,
  }

  const inputProps = {
    ...cellContext,
    cellValue,
    setCellValue,
    getOnMouseDownHandler,
    fieldRef,
    'data-testid': `${cellId}-input-field`,
  }

  return (
    <Cell
      key={cell.row.original._id + cell.id}
      style={{
        left: cell.column.getStart('left') ?? undefined,
        ...getStateStyles(),
      }}
      width={cell.column.getSize()}
      {...cellProps}
    >
      {flexRender(cell.column.columnDef.cell, inputProps)}
    </Cell>
  )
}
