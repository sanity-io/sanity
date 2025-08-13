import {EarthGlobeIcon} from '@sanity/icons'
import {Flex} from '@sanity/ui'
import {format, isValid, parse} from 'date-fns'
import {useCallback, useMemo} from 'react'

import {Button} from '../../../ui-components/button/Button'
import {MONTH_PICKER_VARIANT} from '../../components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../components/inputs/DateInputs/calendar/types'
import {DateTimeInput} from '../../components/inputs/DateInputs/DateTimeInput'
import {getCalendarLabels} from '../../form/inputs/DateInputs/utils'
import useDialogTimeZone from '../../hooks/useDialogTimeZone'
import {type TimeZoneScope, useTimeZone} from '../../hooks/useTimeZone'
import {useTranslation} from '../../i18n/hooks/useTranslation'

interface ScheduleDatePickerProps {
  value: Date | undefined
  onChange: (date: Date) => void
  timeZoneScope: TimeZoneScope
}

const inputDateFormat = 'PP HH:mm'

export const ScheduleDatePicker = ({value, onChange, timeZoneScope}: ScheduleDatePickerProps) => {
  const {t} = useTranslation()
  const {timeZone, utcToCurrentZoneDate, zoneDateToUtc} = useTimeZone(timeZoneScope)
  const {dialogTimeZoneShow, DialogTimeZone, dialogProps} = useDialogTimeZone(timeZoneScope)

  const timeZoneAdjustedValue = value ? utcToCurrentZoneDate(value) : undefined

  const handlePublishAtCalendarChange = (date: Date | null) => {
    if (!date) return

    onChange(zoneDateToUtc(date))
  }

  const handlePublishAtInputChange = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const date = event.currentTarget.value
      const parsedDate = zoneDateToUtc(parse(date, inputDateFormat, new Date()))

      if (isValid(parsedDate)) onChange(parsedDate)
    },
    [onChange, zoneDateToUtc],
  )

  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(t), [t])

  return (
    <Flex flex={1} justify="space-between">
      <DateTimeInput
        selectTime
        monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
        onChange={handlePublishAtCalendarChange}
        onInputChange={handlePublishAtInputChange}
        calendarLabels={calendarLabels}
        value={timeZoneAdjustedValue}
        inputValue={timeZoneAdjustedValue ? format(timeZoneAdjustedValue, inputDateFormat) : ''}
        constrainSize={false}
        padding={0}
        isPastDisabled
        timeZoneScope={timeZoneScope}
      />

      <Button
        icon={EarthGlobeIcon}
        mode="bleed"
        size="default"
        text={`${timeZone.abbreviation}`}
        onClick={dialogTimeZoneShow}
      />
      {DialogTimeZone && <DialogTimeZone {...dialogProps} />}
    </Flex>
  )
}
