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

/** @internal */
export function SheetListCell(props: SheetListCellProps) {
  const {getValue, column, row, fieldType} = props
  const cellId = `cell-${column.id}-${row.index}`
  const [renderValue, setRenderValue] = useState<string>(getValue() as string)
  const [isDirty, setIsDirty] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const {
    focusAnchorCell,
    resetFocusSelection,
    setSelectedAnchorCell,
    getStateByCellId,
    submitFocusedCell,
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

  const handleOnEnterDown = useCallback(
    (event: KeyboardEvent) => {
      const {key} = event
      if (key === 'Enter') {
        if (cellState === 'selectedAnchor') inputRef.current?.focus()
        if (cellState === 'focused') submitFocusedCell()
      }
    },
    [cellState, submitFocusedCell],
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
      const clipboardData = event.clipboardData?.getData('Text')

      if (typeof clipboardData === 'string' || typeof clipboardData === 'number') {
        setRenderValue(clipboardData)
        // patch immediately when pasting
        patchDocument?.(row.id, column.id, clipboardData)
      }
    },
    [column.id, patchDocument, row.id],
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(renderValue.toString())
  }, [renderValue])

  useEffect(() => {
    if (cellState === 'selectedAnchor' || cellState === 'focused')
      // only listen for enter key when cell is focused or anchor
      document.addEventListener('keydown', handleOnEnterDown)
    if (cellState === 'selectedAnchor' || cellState === 'selectedRange')
      // if cell is selected, paste events should be handled
      document.addEventListener('paste', handlePaste)

    if (cellState === 'selectedAnchor')
      // only allow copying when cell is selected anchor
      document.addEventListener('copy', handleCopy)

    return () => {
      if (cellState === 'selectedAnchor' || cellState === 'focused')
        document.removeEventListener('keydown', handleOnEnterDown)
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
    handleOnEnterDown,
    handlePaste,
    row.index,
  ])

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
        <option value="True">True</option>
        <option value="False">False</option>
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
      data-testid={cellId}
      aria-selected={!!cellState}
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
      onMouseDown={handleOnMouseDown}
    />
  )
}
