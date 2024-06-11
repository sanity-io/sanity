/* eslint-disable i18next/no-literal-string */
import {type ObjectFieldType} from '@sanity/types'
import {Select, TextInput} from '@sanity/ui'
import {type Cell, type CellContext, flexRender} from '@tanstack/react-table'
import {type MouseEventHandler, useCallback, useEffect, useRef, useState} from 'react'
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

interface SheetListCellInnerProps extends CellContext<DocumentSheetTableRow, unknown> {
  fieldType: ObjectFieldType
}

type CellInputElement = HTMLInputElement | HTMLSelectElement
type InputRef = CellInputElement | null

/** @internal */
export function SheetListCellInner(props: SheetListCellInnerProps) {
  const {getValue, column, row, fieldType} = props
  const cellId = `cell-${column.id}-${row.index}`
  const providedValueRef = useRef(getValue())
  const [renderValue, setRenderValue] = useState<string>(getValue() as string)
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
  const {patchDocument, unsetDocumentValue} = props.table.options.meta || {}

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
      event.preventDefault()
      setSelectedAnchorCell(column.id, row.index)
    }
  }

  const handleOnBlur = useCallback(() => {
    if (renderValue !== providedValueRef.current) {
      patchDocument?.(row.original.__metadata.idPair.publishedId, column.id, renderValue)
    }
    resetFocusSelection()
  }, [
    column.id,
    patchDocument,
    renderValue,
    resetFocusSelection,
    row.original.__metadata.idPair.publishedId,
  ])

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
            setRenderValue(providedValueRef.current as string)

            // wait for state to settle before blurring
            setTimeout(() => setSelectedAnchorCell(column.id, row.index))
          }
          break
        }

        case 'Delete':
        case 'Backspace': {
          if (cellState !== 'focused') {
            setRenderValue('')
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

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRenderValue(event.target.value)
  }

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData?.getData('Text')

      if (typeof clipboardData === 'string' || typeof clipboardData === 'number') {
        setRenderValue(clipboardData)
        // patch immediately when pasting
        patchDocument?.(row.original.__metadata.idPair.publishedId, column.id, clipboardData)
      }
    },
    [column.id, patchDocument, row.original.__metadata.idPair.publishedId],
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(renderValue.toString())
  }, [renderValue])

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
  }, [
    cellId,
    cellState,
    column.id,
    getStateByCellId,
    handleCopy,
    handleOnKeyDown,
    handlePaste,
    row.index,
  ])

  // Keep value of cell up to date with external changes
  useEffect(() => {
    if (providedValueRef.current && providedValueRef.current !== getValue()) {
      if (providedValueRef.current === renderValue) {
        // do not update the value if it's currently being edited
        setRenderValue(getValue() as string)
      }
      providedValueRef.current = getValue()
    }
  }, [getValue, renderValue])

  const inputProps = {
    'onFocus': handleOnFocus,
    'onBlur': handleOnBlur,
    'onMouseDown': handleOnMouseDown,
    'aria-selected': !!cellState,
    'data-testid': cellId,
    'id': cellId,
    'ref': (ref: InputRef) => (inputRef.current = ref),
  }

  if (fieldType.name === 'boolean') {
    return (
      <Select
        {...inputProps}
        onChange={() => null}
        radius={0}
        style={{
          boxShadow: 'none',
          padding: 0,
        }}
        value={JSON.stringify(renderValue)}
      >
        <option value="True">True</option>
        <option value="False">False</option>
      </Select>
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
        // backgroundColor: 'var(--card-focus-ring-color)',
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
