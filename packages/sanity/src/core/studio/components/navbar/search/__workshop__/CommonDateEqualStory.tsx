import {Card, Inline, Text} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {useCallback, useState} from 'react'
import {CommonDateEqualInput} from '../components/filters/filter/inputs/date/CommonDateEqual'
import {SearchProvider} from '../contexts/search/SearchProvider'
import {OperatorDateEqualValue} from '../definitions/operators/dateOperators'

export default function CommonDateEqualStory() {
  const isDateTime = useBoolean('Datetime', true, 'Props')

  const [value, setValue] = useState<OperatorDateEqualValue | null>(null)

  const handleChange = useCallback((val: OperatorDateEqualValue | null) => {
    setValue(val)
  }, [])

  return (
    <SearchProvider>
      <Card padding={3} shadow={1}>
        <CommonDateEqualInput isDateTime={!!isDateTime} onChange={handleChange} value={value} />
      </Card>
      <Card margin={3} padding={3} shadow={1} tone="primary">
        <Inline space={1}>
          <Text muted size={1} weight="semibold">
            Value:
          </Text>
          <Text muted size={1}>
            {value?.date ? value.date : <em>Empty</em>}
          </Text>
        </Inline>
      </Card>
    </SearchProvider>
  )
}
