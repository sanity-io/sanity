/* eslint-disable i18next/no-literal-string */
import {Select, TextInput} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {type SanityDocument} from 'sanity'

export const SheetListCell = (props: CellContext<SanityDocument, unknown> & {type: any}) => {
  const renderValue = props.getValue()

  if (props.type.name === 'boolean') {
    return (
      <Select
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
      id={`cell-${props.column.id}-${props.row.id}`}
      radius={0}
      border={false}
      value={
        typeof renderValue === 'string' || typeof renderValue === 'number'
          ? renderValue
          : JSON.stringify(renderValue)
      }
    />
  )
}
