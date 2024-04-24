import {Card, Stack} from '@sanity/ui'
import {useState} from 'react'

import useTimeZone from '../../hooks/useTimeZone'
import {type ScheduleFormData} from '../../types'
import {DateTimeInput} from '../dateInputs'

interface Props {
  onChange?: (formData: ScheduleFormData) => void
  value?: ScheduleFormData | null
}

const ScheduleForm = (props: Props) => {
  const {onChange, value} = props

  const {getCurrentZoneDate} = useTimeZone()

  // Date input is stored locally to handle behaviour of the studio's `<LazyTextInput />` component.
  // If we don't keep this local state (and only rely on the canonical value of `ScheduleFormData`),
  // you'll see an unsightly flash when text inputs are blurred / lose focus, as `<LazyTextInput />`
  // clears its internal value before it's had a chance to re-render as a result of its own props changing.
  const [inputValue, setInputValue] = useState<string>()

  const handleChange = (date: string | null) => {
    if (date && onChange) {
      onChange({date})
      setInputValue(date)
    }
  }

  // Only allow dates in the future (`selectedDate` is UTC)
  const handleCustomValidation = (selectedDate: Date): boolean => {
    return selectedDate > getCurrentZoneDate()
  }

  return (
    <Stack space={4}>
      <Card>
        <DateTimeInput
          level={0}
          markers={[]}
          onChange={handleChange}
          type={{
            name: 'date',
            options: {
              customValidation: handleCustomValidation,
              customValidationMessage: 'Date cannot be in the past.',
            },
            title: 'Date and time',
          }}
          value={inputValue === undefined ? value?.date : inputValue}
        />
      </Card>
    </Stack>
  )
}

export default ScheduleForm
