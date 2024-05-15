/* eslint-disable i18next/no-literal-string */
import {Select, TextInput} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {useCallback, useEffect, useState} from 'react'
import {type SanityDocument} from 'sanity'

import {useSheetListContext} from './SheetListContext'

export const SheetListCell = (
  props: CellContext<SanityDocument, unknown> & {
    type: any
  },
) => {
  const {column, row} = props
  const cellId = `cell-${props.column.id}-${props.row.index}`
  const [renderValue, setRenderValue] = useState(props.getValue())
  const {
    setFocusedCellId,
    focusedCellDetails,
    selectedCellIndexes,
    onSelectedCellChange,
    resetFocusSelection,
    resetSelection,
  } = useSheetListContext()

  const handleOnFocus = useCallback(() => {
    setFocusedCellId(column.id, row.index)
  }, [column.id, row.index, setFocusedCellId])

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (
        focusedCellDetails?.colId === column.id &&
        (selectedCellIndexes.includes(row.index) || focusedCellDetails?.rowIndex === row.index)
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
      focusedCellDetails?.colId,
      focusedCellDetails?.rowIndex,
      row.index,
      selectedCellIndexes,
    ],
  )

  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      const {key, shiftKey} = event
      if (document.activeElement?.id === `cell-${column.id}-${row.index}`) {
        // shift alone has no handler
        if (key === 'Shift') return

        if (key === 'ArrowDown' || key === 'ArrowUp') {
          if (shiftKey) {
            event.preventDefault()
            onSelectedCellChange(key === 'ArrowDown' ? 'down' : 'up')
          } else {
            resetFocusSelection()
            setFocusedCellId(column.id, row.index + (key === 'ArrowDown' ? 1 : -1))
          }
        } else {
          resetSelection()
        }
      }
    },
    [
      column.id,
      onSelectedCellChange,
      resetFocusSelection,
      resetSelection,
      row.index,
      setFocusedCellId,
    ],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('mousedown', resetSelection)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('mousedown', resetSelection)
    }
  }, [handleKeydown, handlePaste, resetSelection])

  useEffect(() => {
    const focusedCellId = `cell-${focusedCellDetails?.colId}-${focusedCellDetails?.rowIndex}`
    if (cellId === focusedCellId && document.activeElement?.id !== focusedCellId) {
      document.getElementById(cellId)?.focus()
    }
  }, [
    cellId,
    focusedCellDetails?.colId,
    focusedCellDetails?.rowIndex,
    props.column.id,
    props.row.index,
  ])

  const handleOnBlur = () => {
    // TODO: persist value for focus and selection fields
    resetFocusSelection()
  }

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRenderValue(event.target.value)
  }

  if (props.type.name === 'boolean') {
    return (
      <Select
        onChange={() => null}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
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

  return (
    <TextInput
      size={0}
      id={cellId}
      radius={0}
      border={false}
      style={{
        border:
          focusedCellDetails?.colId === props.column.id &&
          selectedCellIndexes.includes(props.row.index)
            ? '1px solid green'
            : '1px solid transparent',
      }}
      value={
        typeof renderValue === 'string' || typeof renderValue === 'number'
          ? renderValue
          : JSON.stringify(renderValue)
      }
      onChange={handleOnChange}
      onFocus={handleOnFocus}
      onBlur={handleOnBlur}
    />
  )
}
