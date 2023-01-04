import {Card, Inline, Text} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {useCallback, useState} from 'react'
import {CommonDateEqualInput} from '../components/filters/filter/inputs/date/CommonDateEqual'
import {SearchProvider} from '../contexts/search/SearchProvider'

export default function CommonDateEqualStory() {
  const isDateTime = useBoolean('Datetime', true, 'Props')
  const useInputDateFormat = useBoolean('Use input date format', false, 'Props')

  const [value, setValue] = useState<string | null>(null)

  const handleChange = useCallback((val: string | null) => {
    setValue(val)
  }, [])

  return (
    <SearchProvider>
      <Card padding={3} shadow={1}>
        <CommonDateEqualInput
          isDateTime={isDateTime}
          onChange={handleChange}
          useInputDateFormat={useInputDateFormat}
          value={value}
        />
      </Card>
      <Card margin={3} padding={3} shadow={1} tone="primary">
        <Inline space={1}>
          <Text muted size={1} weight="semibold">
            Value:
          </Text>
          <Text muted size={1}>
            {value ? value : <em>Empty</em>}
          </Text>
        </Inline>
      </Card>
    </SearchProvider>
  )
}
