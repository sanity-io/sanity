import {Card} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {useCallback, useState} from 'react'
import {CommonDateRangeInput} from '../components/filters/filter/inputs/date/CommonDateRange'
import {SearchProvider} from '../contexts/search/SearchProvider'
import type {OperatorDateRangeValue} from '../definitions/operators/dateOperators'

export default function CommonDateRangeStory() {
  const selectTime = useBoolean('Select time', true, 'Props')

  const [value, setValue] = useState<OperatorDateRangeValue | null>(null)

  const handleChange = useCallback((val: OperatorDateRangeValue | null) => {
    setValue(val)
  }, [])

  return (
    <SearchProvider>
      <Card padding={3} shadow={1}>
        <CommonDateRangeInput onChange={handleChange} selectTime={selectTime} value={value} />
      </Card>
    </SearchProvider>
  )
}
