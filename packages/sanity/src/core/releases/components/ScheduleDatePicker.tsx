import {EarthGlobeIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import {format, isValid, parse} from 'date-fns'
import {useCallback, useMemo} from 'react'

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

const inputDateFormat = 'PP HH:mm'

export const ScheduleDatePicker = ({
  initialValue: inputValue,
  onChange,
}: ScheduleDatePickerProps) => {
  const {t} = useTranslation()
  const {timeZone, utcToCurrentZoneDate, zoneDateToUtc} = useTimeZone()
  const {dialogTimeZoneShow, DialogTimeZone, dialogProps} = useDialogTimeZone()

  const timezoneAdjustedValue = utcToCurrentZoneDate(inputValue)

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
    <Flex gap={3}>
      <Box flex={1}>
        <DateTimeInput
          selectTime
          monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
          onChange={handlePublishAtCalendarChange}
          onInputChange={handlePublishAtInputChange}
          calendarLabels={calendarLabels}
          value={timezoneAdjustedValue}
          inputValue={format(timezoneAdjustedValue, inputDateFormat)}
          constrainSize={false}
          padding={0}
          isPastDisabled
        />
      </Box>
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
