/* eslint-disable i18next/no-literal-string */
import {Select, TextInput} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {useEffect, useState} from 'react'
import {type SanityDocument} from 'sanity'

import {useSheetListContext} from './SheetListContext'

export const SheetListCell = (
  props: CellContext<SanityDocument, unknown> & {
    type: any
  },
) => {
  const {column, row} = props
  const [renderValue, setRenderValue] = useState(props.getValue())
  const {
    focusedCellId,
    setFocusedCellId,
    focusedCellDetails,
    selectedCellIndexes,
    onSelectedCellChange,
    resetFocusSelection,
  } = useSheetListContext()

  useEffect(() => {
    const cb = (event) => {
      if (document.activeElement?.id === `cell-${column.id}-${row.index}`) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          resetFocusSelection()
        }

        if (event.shiftKey) {
          if (event.key === 'ArrowDown') {
            event.preventDefault()

            onSelectedCellChange('down')
          }

          if (event.key === 'ArrowUp') {
            onSelectedCellChange('up')
          }
        }
      }
    }
    document.addEventListener('keydown', cb)

    const handlePaste = (event) => {
      if (focusedCellDetails?.colId === column.id && selectedCellIndexes.includes(row.index)) {
        event.preventDefault()
        const clipboardData = event.clipboardData.getData('Text')

        if (typeof clipboardData === 'string' || typeof clipboardData === 'number') {
          setRenderValue(clipboardData)
        }
      }
    }

    document.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('keydown', cb)
      document.removeEventListener('paste', handlePaste)
    }
  }, [
    resetFocusSelection,
    column.id,
    focusedCellDetails?.colId,
    onSelectedCellChange,
    props.table.options.meta,
    row.index,
    selectedCellIndexes,
  ])

  const handleOnFocus = () => {
    setFocusedCellId(`cell-${column.id}-${row.index}`, column.id, row.index)
  }

  const handleOnBlur = () => {
    resetFocusSelection()
  }

  useEffect(() => {
    if (focusedCellId === `cell-${column.id}-${row.index}`) {
      document.getElementById(`cell-${column.id}-${row.index}`)?.focus()
    }
  }, [column.id, focusedCellId, row.index])

  if (props.type.name === 'boolean') {
    return (
      <Select
        onChange={() => null}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        key={`cell-${props.column.id}-${props.row.index}`}
        id={`cell-${props.column.id}-${props.row.index}`}
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
      key={`cell-${props.column.id}-${props.row.index}`}
      id={`cell-${props.column.id}-${props.row.index}`}
      radius={0}
      border={false}
      style={{
        border:
          focusedCellDetails?.colId === props.column.id &&
          selectedCellIndexes.includes(props.row.index)
            ? '1px solid green'
            : undefined,
      }}
      value={
        typeof renderValue === 'string' || typeof renderValue === 'number'
          ? renderValue
          : JSON.stringify(renderValue)
      }
      onChange={() => null}
      onFocus={handleOnFocus}
      onBlur={handleOnBlur}
    />
  )
}
