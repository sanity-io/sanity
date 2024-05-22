/* eslint-disable i18next/no-literal-string */
import {type ObjectFieldType} from '@sanity/types'
import {Select, TextInput} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {type FormEvent, useCallback, useEffect, useState} from 'react'
import {type SanityDocument} from 'sanity'

interface SheetListCellProps extends CellContext<SanityDocument, unknown> {
  fieldType: ObjectFieldType
}

export function SheetListCell(props: SheetListCellProps) {
  const {getValue, column, row, fieldType} = props
  const initialValue = getValue() || ''
  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue)

  const handleOnChange = useCallback((e: FormEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value)
  }, [])

  useEffect(() => {
    setValue(initialValue || '')
  }, [initialValue])

  if (fieldType.name === 'boolean') {
    return (
      <Select
        radius={0}
        style={{
          boxShadow: 'none',
        }}
        value={JSON.stringify(value)}
        onChange={() => null}
      >
        <option value="True">True</option>
        <option value="False">False</option>
      </Select>
    )
  }

  return (
    <TextInput
      size={0}
      id={`cell-${column.id}-${row.id}`}
      radius={0}
      border={false}
      onChange={handleOnChange}
      value={typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value)}
    />
  )
}
