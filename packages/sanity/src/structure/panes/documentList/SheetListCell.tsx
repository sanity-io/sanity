/* eslint-disable i18next/no-literal-string */
import {Select, Text} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {type SanityDocument} from 'sanity'

export const SheetListCell = (props: CellContext<SanityDocument, unknown> & {type: any}) => {
  const renderValue = props.getValue()

  if (!renderValue) return null
  if (props.type.name === 'boolean') {
    return (
      <Select value={JSON.stringify(renderValue)}>
        <option value="true">True</option>
        <option value="false">False</option>
      </Select>
    )
  }

  if (typeof renderValue === 'string' || typeof renderValue === 'number') {
    return <Text size={0}>{renderValue}</Text>
  }
  return <Text size={0}>{JSON.stringify(renderValue)}</Text>
}
