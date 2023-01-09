import {Card, Inline, Stack, Text} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {useCallback, useState} from 'react'
import {CommonDateRangeInput} from '../components/filters/filter/inputs/date/CommonDateRange'
import {SearchProvider} from '../contexts/search/SearchProvider'
import type {OperatorDateRangeValue} from '../definitions/operators/dateOperators'

export default function CommonDateRangeStory() {
  const isDateTime = useBoolean('Datetime', true, 'Props')

  const [value, setValue] = useState<OperatorDateRangeValue | null>(null)

  const handleChange = useCallback((val: OperatorDateRangeValue | null) => {
    setValue(val)
  }, [])

  return (
    <SearchProvider>
      <Card padding={3} shadow={1}>
        <CommonDateRangeInput isDateTime={!!isDateTime} onChange={handleChange} value={value} />
      </Card>
      <Card margin={3} padding={3} shadow={1} tone="primary">
        <Stack space={3}>
          <Inline space={1}>
            <Text muted size={1} weight="semibold">
              Start:
            </Text>
            <Text muted size={1}>
              {value?.dateMin ? value.dateMin : <em>Empty</em>}
            </Text>
          </Inline>
          <Inline space={1}>
            <Text muted size={1} weight="semibold">
              End:
            </Text>
            <Text muted size={1}>
              {value?.dateMax ? value.dateMax : <em>Empty</em>}
            </Text>
          </Inline>
        </Stack>
      </Card>
    </SearchProvider>
  )
}
