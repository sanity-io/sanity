import {Flex, Stack} from '@sanity/ui'
import {addDays} from 'date-fns'
import {useCallback, useMemo, useState} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import type {OperatorDateRangeValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {useTranslation} from '../../../../../../../../../i18n'
import {DateIncludeTimeFooter} from './dateIncludeTimeFooter/DateIncludeTimeFooter'
import {DatePicker} from './datePicker/DatePicker'
import {ParsedDateTextInput} from './ParsedDateTextInput'
import {getDateISOString} from './utils/getDateISOString'

const PLACEHOLDER_START_DATE_OFFSET = -7 // days

export function CommonDateRangeInput({
  initialFocusedDate,
  isDateTime,
  onChange,
  value,
}: OperatorInputComponentProps<OperatorDateRangeValue> & {
  initialFocusedDate?: Date
  isDateTime: boolean
}) {
  const [selectEndDate, setSelectEndDate] = useState(false)

  const {t} = useTranslation()
  const {
    state: {fullscreen},
  } = useSearchState()

  /**
   * For placeholder values: Use the current date for the end date input, and an arbitrary date
   * in the past (e.g. -7 days from now) for the start date input.
   */
  const placeholderStartDate = useMemo(() => addDays(new Date(), PLACEHOLDER_START_DATE_OFFSET), [])
  const placeholderEndDate = useMemo(() => new Date(), [])

  const handleDatePickerChange = useCallback(
    ({date, endDate}: {date?: Date | null; endDate?: Date | null}) => {
      // After a date has been picked, alternate target _only_ if either date or endDate is set.
      if (date && !endDate) setSelectEndDate(true)
      if (!date && endDate) setSelectEndDate(false)

      onChange(
        getStartAndEndDate({
          date,
          endDate,
          includeTime: value?.includeTime,
          isDateTime,
        }),
      )
    },
    [isDateTime, onChange, value?.includeTime],
  )

  const handleIncludeTimeChange = useCallback(() => {
    const includeTime = !value?.includeTime
    onChange(
      getStartAndEndDate({
        date: value?.from ? new Date(value.from) : null,
        endDate: value?.to ? new Date(value.to) : null,
        includeTime,
        isDateTime,
      }),
    )
  }, [isDateTime, onChange, value])

  const handleTextEndDateChange = useCallback(
    (date: string | null) => {
      onChange({
        includeTime: value?.includeTime,
        to: date || null,
        from: value?.from || null,
      })
    },
    [onChange, value],
  )

  const handleTextEndDateFocus = useCallback(() => setSelectEndDate(true), [])

  const handleTextStartDateChange = useCallback(
    (date: string | null) => {
      onChange({
        includeTime: value?.includeTime,
        to: value?.to || null,
        from: date || null,
      })
    },
    [onChange, value],
  )

  const handleTextStartDateFocus = useCallback(() => setSelectEndDate(false), [])

  return (
    <div>
      <Stack space={3}>
        <Flex direction="column" gap={3}>
          {/* Start date */}
          <ParsedDateTextInput
            aria-label={t('search.filter-date-range-start-date-aria-label')}
            data-testid="input-start-date"
            fontSize={fullscreen ? 2 : 1}
            isDateTime={isDateTime}
            isDateTimeFormat={isDateTime && value?.includeTime}
            onChange={handleTextStartDateChange}
            onFocus={handleTextStartDateFocus}
            placeholderDate={placeholderStartDate}
            radius={2}
            value={value?.from}
          />
          {/* End date */}
          <ParsedDateTextInput
            aria-label={t('search.filter-date-range-end-date-aria-label')}
            data-testid="input-end-date"
            fontSize={fullscreen ? 2 : 1}
            isDateTime={isDateTime}
            isDateTimeFormat={isDateTime && value?.includeTime}
            onChange={handleTextEndDateChange}
            onFocus={handleTextEndDateFocus}
            placeholderDate={placeholderEndDate}
            radius={2}
            value={value?.to}
          />
        </Flex>
        <DatePicker
          date={value?.from ? new Date(value.from) : undefined}
          endDate={value?.to ? new Date(value.to) : undefined}
          initialFocusedDate={initialFocusedDate}
          onChange={handleDatePickerChange}
          selectEndDate={selectEndDate}
          selectRange
          selectTime={isDateTime}
        />
        {/* Include time footer */}
        {isDateTime && (
          <DateIncludeTimeFooter onChange={handleIncludeTimeChange} value={!!value?.includeTime} />
        )}
      </Stack>
    </div>
  )
}

function getStartAndEndDate({
  date,
  endDate,
  includeTime,
  isDateTime,
}: {
  date?: Date | null
  endDate?: Date | null
  includeTime?: boolean
  isDateTime?: boolean
}): {
  includeTime?: boolean
  to: string | null
  from: string | null
} {
  if (includeTime) {
    return {
      includeTime,
      to: endDate
        ? getDateISOString({date: endDate, dateOnly: !isDateTime, roundDay: 'start'})
        : null,
      from: date ? getDateISOString({date: date, dateOnly: !isDateTime, roundDay: 'start'}) : null,
    }
  }

  return {
    includeTime,
    to: endDate ? getDateISOString({date: endDate, dateOnly: !isDateTime, roundDay: 'end'}) : null,
    from: date ? getDateISOString({date, dateOnly: !isDateTime, roundDay: 'start'}) : null,
  }
}
