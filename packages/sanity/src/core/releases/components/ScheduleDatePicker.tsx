import {EarthGlobeIcon} from '@sanity/icons'
import {Flex} from '@sanity/ui'
import {addMinutes, format, isBefore} from 'date-fns'
import {useMemo, useState} from 'react'

import {Button} from '../../../ui-components/button'
import {MONTH_PICKER_VARIANT} from '../../components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../components/inputs/DateInputs/calendar/types'
import {DateTimeInput} from '../../components/inputs/DateInputs/DateTimeInput'
import {getCalendarLabels} from '../../form/inputs/DateInputs'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import useDialogTimeZone from '../../scheduledPublishing/hooks/useDialogTimeZone'
import useTimeZone from '../../scheduledPublishing/hooks/useTimeZone'

interface ScheduleDatePickerProps {
  initialValue: Date
  onChange: (date: Date) => void
}

export const ScheduleDatePicker = ({
  initialValue: inputValue,
  onChange,
}: ScheduleDatePickerProps) => {
  const {t} = useTranslation()
  const {timeZone} = useTimeZone()
  const {dialogTimeZoneShow} = useDialogTimeZone()
  const [isBeforeNow, setIsBeforeNow] = useState(false)

  const handleBundlePublishAtCalendarChange = (date: Date | null) => {
    if (!date) return
    if (isBefore(date, addMinutes(new Date(), 1))) {
      setIsBeforeNow(true)
      return
    }

    onChange(date)
  }

  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(t), [t])

  return (
    <Flex flex={1} justify="space-between">
      <DateTimeInput
        selectTime
        monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
        onChange={handleBundlePublishAtCalendarChange}
        calendarLabels={calendarLabels}
        value={inputValue}
        inputValue={format(inputValue, 'PPp')}
        constrainSize={false}
        padding={0}
        isPastDisabled
        disableInput
      />

      <Button
        icon={EarthGlobeIcon}
        mode="bleed"
        size="default"
        text={`${timeZone.abbreviation}`}
        onClick={dialogTimeZoneShow}
      />
    </Flex>
  )
}
