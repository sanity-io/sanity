/* eslint-disable i18next/no-literal-string */
import {Select, TextInput} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {type FormEvent, useCallback, useEffect, useState} from 'react'
import {type SanityDocument} from 'sanity'

interface SheetListCellProps extends CellContext<SanityDocument, unknown> {
  type: any
}

export function SheetListCell(props: SheetListCellProps) {
  const initialValue = props.getValue() || ''
  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue)

  // When the input is blurred, we'll call our table meta's updateData function
  const handleOnBlur = () => {
    //@ts-expect-error - wip.
    props.table.options.meta?.updateData()
  }

  const handleOnChange = useCallback((e: FormEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value)
  }, [])

  useEffect(() => {
    setValue(initialValue || '')
  }, [initialValue])

  if (props.type.name === 'boolean') {
    return (
      <Select
        radius={0}
        style={{
          boxShadow: 'none',
        }}
        value={JSON.stringify(value)}
        onBlur={handleOnBlur}
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
      id={`cell-${props.column.id}-${props.row.id}`}
      radius={0}
      border={false}
      onChange={handleOnChange}
      onBlur={handleOnBlur}
      value={typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value)}
    />
  )
}
