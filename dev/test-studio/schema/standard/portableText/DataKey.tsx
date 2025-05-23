import {uuid} from '@sanity/uuid'
import {useEffect} from 'react'
import {set, useFormValue, type StringInputProps} from 'sanity'

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

export function DataKeySelection(props: StringInputProps) {
  const {value, onChange} = props
  const parentValue = useFormValue(props.path.slice(0, 1)) as any[]
  const headerRow = parentValue.find((row) => row._type === 'headerRow')
  const dataKeys = headerRow?.columns?.map((column) => column.dataKey)

  return props.renderDefault({
    ...props,
    schemaType: {
      ...props.schemaType,
      options: {
        list: dataKeys,
      },
    },
  })
}
