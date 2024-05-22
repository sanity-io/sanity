/* eslint-disable i18next/no-literal-string */
import {type ObjectFieldType} from '@sanity/types'
import {Select, TextInput} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {type MouseEventHandler, useCallback, useEffect, useRef, useState} from 'react'
import {type SanityDocument} from 'sanity'

import {useSheetListContext} from './SheetListProvider'

interface SheetListCellProps extends CellContext<SanityDocument, unknown> {
  fieldType: ObjectFieldType
}

export function SheetListCell(props: SheetListCellProps) {
  const {getValue, column, row, fieldType} = props
  const cellId = `cell-${column.id}-${row.index}`
  const [renderValue, setRenderValue] = useState(getValue())
  const [isDirty, setIsDirty] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null)
  const {
    focusAnchorCell,
    resetFocusSelection,
    setSelectedAnchorCell,
    getStateByCellId,
    submitChanges,
  } = useSheetListContext()
  const cellState = getStateByCellId(column.id, row.index)

  const handleOnFocus = useCallback(() => {
    // reselect in cases where focus achieved without initial mousedown
    setSelectedAnchorCell(column.id, row.index)
    focusAnchorCell()
  }, [column.id, focusAnchorCell, row.index, setSelectedAnchorCell])
  const {patchDocument} = props.table.options.meta || {}

  const handleOnMouseDown: MouseEventHandler<HTMLInputElement> = (event) => {
    if (event.detail === 2) {
      inputRef.current?.focus()
    } else {
      event.preventDefault()
      setSelectedAnchorCell(column.id, row.index)
    }
  }

  const handleOnKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const {key} = event
      if (key === 'Enter') {
        if (cellState === 'selectedAnchor') inputRef.current?.focus()
        if (cellState === 'focused') submitChanges()
      }
    },
    [cellState, submitChanges],
  )

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true)
    setRenderValue(event.target.value)
  }

  const handleOnBlur = () => {
    if (isDirty) {
      patchDocument?.(row.id, column.id, renderValue)
      setIsDirty(false)
    }
    resetFocusSelection()
  }

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      event.preventDefault()
      const clipboardData = event.clipboardData?.getData('Text')

      if (typeof clipboardData === 'string' || typeof clipboardData === 'number') {
        setRenderValue(clipboardData)
        // patch immediately when pasting
        patchDocument?.(row.id, column.id, clipboardData)
      }
    },
    [column.id, patchDocument, row.id],
  )

  useEffect(() => {
    if (cellState === 'selectedAnchor' || cellState === 'focused') {
      document.addEventListener('keydown', handleOnKeyDown)
    }

    if (cellState) {
      document.addEventListener('paste', handlePaste)
    }

    return () => {
      if (cellState === 'selectedAnchor' || cellState === 'focused') {
        document.removeEventListener('keydown', handleOnKeyDown)
      }

      if (cellState) {
        document.removeEventListener('paste', handlePaste)
      }
    }
  }, [cellId, cellState, column.id, getStateByCellId, handleOnKeyDown, handlePaste, row.index])

  if (fieldType.name === 'boolean') {
    return (
      <Select
        onChange={() => null}
        onFocus={handleOnFocus}
        onBlur={resetFocusSelection}
        id={cellId}
        ref={inputRef}
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
    if (cellState === 'focused') return '2px solid blue'
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
      ref={inputRef}
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
      onBlur={handleOnBlur}
      // onPaste={handlePaste}
      onMouseDown={handleOnMouseDown}
    />
  )
}
