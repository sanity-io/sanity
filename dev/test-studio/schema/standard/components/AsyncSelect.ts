import {useEffect, useState} from 'react'
import {type StringInputProps, type TitledListValue, type StringOptions} from 'sanity'

type AsyncSelectListItem = TitledListValue<string> | string

export default function AsyncSelect(props: StringInputProps) {
  const {schemaType, renderDefault} = props
  const {url, formatResponse} =
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    (schemaType.options as StringOptions & {
      url?: string
      formatResponse?: (json: unknown) => AsyncSelectListItem[]
    }) ?? {}
  const [listItems, setListItems] = useState<AsyncSelectListItem[]>([])

  useEffect(() => {
    if (!url || !formatResponse) return

    const fetchData = async () => {
      const response = await fetch(url)
      const json: unknown = await response.json()
      setListItems(formatResponse(json))
    }

    void fetchData()
  }, [url, formatResponse])

  return renderDefault({
    ...props,
    schemaType: {...schemaType, options: {...schemaType.options, list: listItems}},
  })
}
