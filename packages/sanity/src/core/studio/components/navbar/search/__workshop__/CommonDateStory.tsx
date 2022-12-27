import {Card} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {useCallback, useState} from 'react'
import {CommonDateInput} from '../components/filters/filter/inputs/date/CommonDate'
import {SearchProvider} from '../contexts/search/SearchProvider'

export default function CommonDateStory() {
  const selectTime = useBoolean('Select time', true, 'Props')

  const [value, setValue] = useState<string | null>(null)

  const handleChange = useCallback((val: string | null) => {
    setValue(val)
  }, [])

  return (
    <SearchProvider>
      <Card padding={3} shadow={1}>
        <CommonDateInput onChange={handleChange} selectTime={selectTime} value={value} />
      </Card>
    </SearchProvider>
  )
}
