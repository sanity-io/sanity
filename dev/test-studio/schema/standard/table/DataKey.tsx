import {uuid} from '@sanity/uuid'
import {useEffect} from 'react'
import {set, type StringInputProps, useFormValue} from 'sanity'

import {type DataRow, type Table} from './types'

export function DataKeyCreation(props: StringInputProps) {
  const {value, onChange} = props
  const parentValue = useFormValue(props.path.slice(0, -1)) as {
    dataType: string
    dataKey: string
    title: string
  }

  useEffect(() => {
    if (parentValue.dataType && !value?.startsWith(parentValue.dataType)) {
      onChange(set(`${parentValue.dataType}-${uuid()}`))
    }
  }, [parentValue, value, onChange])
  return props.renderDefault(props)
}

/**
 * Dynamically injects the data key into the input
 */
export function DataKeySelection(props: StringInputProps) {
  const tableValue = useFormValue(props.path.slice(0, -4)) as Table['rows']
  const rowValue = useFormValue(props.path.slice(0, -3)) as DataRow
  const cellValue = useFormValue(props.path.slice(0, -1)) as DataRow['cells'][number]
  const headerDataKeys = tableValue
    .find((row) => row._type === 'headerRow')
    ?.columns.map((column) => column.dataKey)
  const usedDataKeys = rowValue?.cells?.map((cell) => cell.dataKey) ?? []
  const availableDataKeys = headerDataKeys?.filter((key) => !usedDataKeys.includes(key))

  return props.renderDefault({
    ...props,
    schemaType: {
      ...props.schemaType,
      options: {
        list: cellValue?.dataKey ? headerDataKeys : availableDataKeys,
      },
    },
  })
}
