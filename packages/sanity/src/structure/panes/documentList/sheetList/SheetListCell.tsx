/* eslint-disable i18next/no-literal-string */
import {
  type BooleanSchemaType,
  isBooleanSchemaType,
  isNumberSchemaType,
  isStringSchemaType,
  type NumberSchemaType,
  type StringSchemaType,
} from '@sanity/types'
import {Box, TextInput} from '@sanity/ui'
import {type Cell, type CellContext, flexRender} from '@tanstack/react-table'
import {type MouseEventHandler, useCallback, useEffect, useRef, useState} from 'react'
import {styled} from 'styled-components'

import CellSelect from './cellFields/CellSelect'
import {type CellState, useDocumentSheetListContext} from './DocumentSheetListProvider'
import {type DocumentSheetTableRow} from './types'

export const useSheetListCell = (
  cellState: CellState,
  cellValue: any,
  setCellValue: (cellValue: any) => void,
  _patchDocument: (value: string) => void,
  parsePasteValue: (clipboardData: string | undefined) => string | number | boolean,
) => {
  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData?.getData('Text')
      const pasteData = parsePasteValue(clipboardData)
      console.log({clipboardData, pasteData})

      // if (typeof clipboardData === 'string' || typeof clipboardData === 'number') {
      setCellValue(pasteData)
      // patch immediately when pasting
      _patchDocument(pasteData)
      // }
    },
    [_patchDocument, parsePasteValue, setCellValue],
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cellValue.toString())
  }, [cellValue])

  useEffect(() => {
    if (cellState === 'selectedAnchor' || cellState === 'selectedRange')
      // if cell is selected, paste events should be handled
      document.addEventListener('paste', handlePaste)

    if (cellState === 'selectedAnchor')
      // only allow copying when cell is selected anchor
      document.addEventListener('copy', handleCopy)

    return () => {
      if (cellState === 'selectedAnchor' || cellState === 'selectedRange')
        document.removeEventListener('paste', handlePaste)
      if (cellState === 'selectedAnchor') document.removeEventListener('copy', handleCopy)
    }
  }, [cellState, handleCopy, handlePaste])
}

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

interface SheetListCellInnerProps extends CellContext<DocumentSheetTableRow, unknown> {
  fieldType: BooleanSchemaType | StringSchemaType | NumberSchemaType
}

type CellInputElement = HTMLInputElement | HTMLSelectElement
type InputRef = CellInputElement | null

/** @internal */
export function SheetListCellInner(props: SheetListCellInnerProps) {
  const {getValue, column, row, fieldType} = props
  const cellId = `cell-${column.id}-${row.index}`
  const [renderValue, setRenderValue] = useState<string>(getValue() as string)
  const [isDirty, setIsDirty] = useState(false)
  const inputRef = useRef<InputRef>(null)
  const {
    focusAnchorCell,
    resetFocusSelection,
    setSelectedAnchorCell,
    getStateByCellId,
    submitFocusedCell,
  } = useDocumentSheetListContext()
  const cellState = getStateByCellId(column.id, row.index)

  const handleOnFocus = useCallback(() => {
    // reselect in cases where focus achieved without initial mousedown
    setSelectedAnchorCell(column.id, row.index)
    focusAnchorCell()
  }, [column.id, focusAnchorCell, row.index, setSelectedAnchorCell])
  const {patchDocument} = props.table.options.meta || {}

  const _patchDocument = useCallback(
    (value: any) => patchDocument?.(row.original.__metadata.idPair.publishedId, column.id, value),
    [column.id, patchDocument, row.original.__metadata.idPair.publishedId],
  )

  const handleProgrammaticFocus = () => {
    inputRef.current?.focus()
    if (inputRef.current instanceof HTMLInputElement) {
      inputRef.current.select()
    }
  }

  const handleOnMouseDown: MouseEventHandler<CellInputElement> = (event) => {
    if (event.detail === 2) {
      handleProgrammaticFocus()
    } else {
      if (cellState === 'selectedAnchor') {
        return handleProgrammaticFocus()
      }

      event.preventDefault()
      setSelectedAnchorCell(column.id, row.index)
    }
  }

  const handleOnEnterDown = useCallback(
    (event: KeyboardEvent) => {
      const {key} = event
      if (key === 'Enter') {
        if (cellState === 'selectedAnchor') handleProgrammaticFocus()
        if (cellState === 'focused') submitFocusedCell()
      }
    },
    [cellState, submitFocusedCell],
  )

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setIsDirty(true)
    setRenderValue(event.target.value)
  }

  const handleOnBlur = () => {
    if (isDirty) {
      _patchDocument(renderValue)
      setIsDirty(false)
    }
    resetFocusSelection()
  }

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData?.getData('Text')

      if (typeof clipboardData === 'string' || typeof clipboardData === 'number') {
        setRenderValue(clipboardData)
        // patch immediately when pasting
        _patchDocument(clipboardData)
      }
    },
    [_patchDocument],
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(renderValue.toString())
  }, [renderValue])

  useEffect(() => {
    if (cellState === 'selectedAnchor' || cellState === 'focused')
      // only listen for enter key when cell is focused or anchor
      document.addEventListener('keydown', handleOnEnterDown)
    // if (cellState === 'selectedAnchor' || cellState === 'selectedRange')
    //   // if cell is selected, paste events should be handled
    //   document.addEventListener('paste', handlePaste)

    // if (cellState === 'selectedAnchor')
    //   // only allow copying when cell is selected anchor
    //   document.addEventListener('copy', handleCopy)

    return () => {
      if (cellState === 'selectedAnchor' || cellState === 'focused')
        document.removeEventListener('keydown', handleOnEnterDown)
      // if (cellState === 'selectedAnchor' || cellState === 'selectedRange')
      //   document.removeEventListener('paste', handlePaste)
      // if (cellState === 'selectedAnchor') document.removeEventListener('copy', handleCopy)
    }
  }, [cellState, handleCopy, handleOnEnterDown, handlePaste])

  const inputProps = {
    'onFocus': handleOnFocus,
    'onBlur': handleOnBlur,
    'onMouseDown': handleOnMouseDown,
    'aria-selected': !!cellState,
    'data-testid': cellId,
    'id': cellId,
    'ref': (ref: InputRef) => (inputRef.current = ref),
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
    fieldType.options?.layout === 'dropdown'
  ) {
    return (
      <Box
        {...inputProps}
        style={{flexGrow: 1, height: '100%', display: 'flex', alignItems: 'center'}}
      >
        <CellSelect
          fieldType={fieldType}
          onCellValueChange={setRenderValue}
          cellValue={renderValue}
          patchDocument={_patchDocument}
          cellState={cellState}
        />
      </Box>
    )
  }

  return (
    <TextInput
      {...inputProps}
      size={0}
      radius={0}
      border={false}
      __unstable_disableFocusRing
      style={{
        padding: '22px 16px',
      }}
      value={
        typeof renderValue === 'string' || typeof renderValue === 'number'
          ? renderValue
          : JSON.stringify(renderValue)
      }
      onChange={handleOnChange}
    />
  )
}

/** @internal */
export function SheetListCell(cell: Cell<DocumentSheetTableRow, unknown>) {
  const isPinned = cell.column.getIsPinned()
  const Cell = isPinned ? PinnedDataCell : DataCell

  const {getStateByCellId} = useDocumentSheetListContext()
  const cellState = getStateByCellId(cell.column.id, cell.row.index)

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

  return (
    <Cell
      key={cell.row.original._id + cell.id}
      style={{
        left: cell.column.getStart('left') ?? undefined,
        ...getStateStyles(),
      }}
      width={cell.column.getSize()}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext?.())}
    </Cell>
  )
}
