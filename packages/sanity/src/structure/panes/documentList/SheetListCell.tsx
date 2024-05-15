/* eslint-disable i18next/no-literal-string */
import {Select, TextInput} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {type FormEvent, useCallback, useState} from 'react'
import {type SanityDocument} from 'sanity'

export const SheetListCell = (props: CellContext<SanityDocument, unknown> & {type: any}) => {
  const {index, id} = props as any
  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(props.getValue() || '')

  // When the input is blurred, we'll call our table meta's updateData function
  const handleOnBlur = () => {
    props.table.options.meta?.updateData(index, id, value)
  }

  const handleOnChange = useCallback((e: FormEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value)
  }, [])

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
