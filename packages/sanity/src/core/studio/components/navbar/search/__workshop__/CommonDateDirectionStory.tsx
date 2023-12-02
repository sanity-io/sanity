import {Card, Inline, Text} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React, {useCallback, useState} from 'react'
import {CommonDateDirectionInput} from '../components/filters/filter/inputs/date/CommonDateDirection'
import {SearchProvider} from '../contexts/search/SearchProvider'
import {OperatorDateDirectionValue} from '../definitions/operators/dateOperators'

const DIRECTION_OPTIONS: Record<string, 'after' | 'before'> = {
  after: 'after',
  before: 'before',
}

export default function CommonDateDirectionStory() {
  const isDateTime = useBoolean('Datetime', true, 'Props')
  const direction = useSelect('Direction', DIRECTION_OPTIONS, 'after')

  const [value, setValue] = useState<OperatorDateDirectionValue | null>(null)

  const handleChange = useCallback((val: OperatorDateDirectionValue | null) => {
    setValue(val)
  }, [])

  if (!direction) {
    return null
  }

  return (
    <SearchProvider>
      <Card padding={3} shadow={1}>
        <CommonDateDirectionInput
          direction={direction}
          isDateTime={!!isDateTime}
          onChange={handleChange}
          value={value}
        />
      </Card>
      <Card margin={3} padding={3} shadow={1} tone="primary">
        <Inline space={1}>
          <Text muted size={1} weight="medium">
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
