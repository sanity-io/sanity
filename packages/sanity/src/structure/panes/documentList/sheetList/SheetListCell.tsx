/* eslint-disable i18next/no-literal-string */
import {type ObjectFieldType} from '@sanity/types'
import {Select, TextInput} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {
  type ClipboardEventHandler,
  type MouseEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react'
import {type SanityDocument} from 'sanity'

import {useSheetListContext} from './SheetListProvider'

interface SheetListCellProps extends CellContext<SanityDocument, unknown> {
  fieldType: ObjectFieldType
}

export function SheetListCell(props: SheetListCellProps) {
  const {getValue, column, row, fieldType} = props
  const cellId = `cell-${column.id}-${row.index}`
  const [renderValue, setRenderValue] = useState(getValue())
  const {
    focusAnchorCell,
    selectedRangeCellIndexes,
    resetFocusSelection,
    setSelectedAnchorCell,
    selectedAnchorCellDetails,
    getStateByCellId,
    submitChanges,
  } = useSheetListContext()
  const cellState = getStateByCellId(column.id, row.index)

  const handleOnFocus = useCallback(() => {
    // reselect in cases where focus achieved without initial mousedown
    setSelectedAnchorCell(column.id, row.index)
    focusAnchorCell()
  }, [column.id, focusAnchorCell, row.index, setSelectedAnchorCell])

  const handlePaste = useCallback<ClipboardEventHandler<HTMLInputElement>>(
    (event) => {
      if (
        selectedAnchorCellDetails?.colId === column.id &&
        (selectedRangeCellIndexes.includes(row.index) ||
          selectedAnchorCellDetails?.rowIndex === row.index)
      ) {
        event.preventDefault()
        const clipboardData = event.clipboardData?.getData('Text')

        if (typeof clipboardData === 'string' || typeof clipboardData === 'number') {
          setRenderValue(clipboardData)
        }
      }
    },
    [
      column.id,
      row.index,
      selectedAnchorCellDetails?.colId,
      selectedAnchorCellDetails?.rowIndex,
      selectedRangeCellIndexes,
    ],
  )

  const handleOnMouseDown: MouseEventHandler<HTMLInputElement> = (event) => {
    if (event.detail === 2) {
      document.getElementById(cellId)?.focus()
    } else {
      event.preventDefault()
      setSelectedAnchorCell(column.id, row.index)
    }
  }

  const handleOnKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const {key} = event
      if (key === 'Enter') {
        if (cellState === 'selectedAnchor') document.getElementById(cellId)?.focus()
        if (cellState === 'focused') submitChanges()
      }
    },
    [cellId, cellState, submitChanges],
  )

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRenderValue(event.target.value)
  }

  useEffect(() => {
    if (cellState === 'selectedAnchor' || cellState === 'focused') {
      document.addEventListener('keydown', handleOnKeyDown)
    }

    return () => {
      if (cellState === 'selectedAnchor' || cellState === 'focused') {
        document.removeEventListener('keydown', handleOnKeyDown)
      }
    }
  }, [cellId, cellState, column.id, getStateByCellId, handleOnKeyDown, row.index])

  if (fieldType.name === 'boolean') {
    return (
      <Select
        onChange={() => null}
        onFocus={handleOnFocus}
        onBlur={resetFocusSelection}
        id={cellId}
        radius={0}
        style={{
          boxShadow: 'none',
        }}
        value={JSON.stringify(renderValue)}
      >
        <option value="true">True</option>
        <option value="false">False</option>
      </Select>
    )
  }

  const getBorderStyle = () => {
    if (cellState === 'focused') {
      return '2px solid blue'
    }
    if (cellState === 'selectedRange') return '1px solid green'
    if (cellState === 'selectedAnchor') return '1px solid blue'

    return '1px solid transparent'
  }

  return (
    <TextInput
      size={0}
      id={cellId}
      radius={0}
      border={false}
      style={{
        border: getBorderStyle(),
      }}
      value={
        typeof renderValue === 'string' || typeof renderValue === 'number'
          ? renderValue
          : JSON.stringify(renderValue)
      }
      onChange={handleOnChange}
      onFocus={handleOnFocus}
      onBlur={resetFocusSelection}
      onPaste={handlePaste}
      onMouseDown={handleOnMouseDown}
    />
  )
}
