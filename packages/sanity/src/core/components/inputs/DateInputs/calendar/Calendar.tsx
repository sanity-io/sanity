import {ChevronLeftIcon, ChevronRightIcon, EarthGlobeIcon} from '@sanity/icons'
import {Box, Flex, Grid, Select, Text} from '@sanity/ui'
import {addDays, addMonths, setDate, setHours, setMinutes, setMonth, setYear} from 'date-fns'
import {format as formatTZ, utcToZonedTime, zonedTimeToUtc} from 'date-fns-tz'
import {range} from 'lodash'
import {
  type ComponentProps,
  type FormEvent,
  type ForwardedRef,
  forwardRef,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'

import {Button} from '../../../../../ui-components/button/Button'
import {TooltipDelayGroupProvider} from '../../../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import useDialogTimeZone from '../../../../scheduledPublishing/hooks/useDialogTimeZone'
import useTimeZone from '../../../../scheduledPublishing/hooks/useTimeZone'
import {CalendarMonth} from './CalendarMonth'
import {ARROW_KEYS, DEFAULT_TIME_PRESETS, HOURS_24} from './constants'
import {features} from './features'
import {type CalendarLabels, type MonthNames} from './types'
import {formatTime} from './utils'
import {YearInput} from './YearInput'

const format = (date: Date, formatStr: string, options?: {timezone?: string}) => {
  if (!options?.timezone) {
    const dateParts = date
      .toLocaleString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .split('/')

    switch (formatStr) {
      case 'DD':
        return dateParts[1]
      case 'MM':
        return dateParts[0]
      default:
        return dateParts[2]
    }
  }

  const zonedDate = utcToZonedTime(date, options.timezone)
  const formatPattern =
    {
      DD: 'dd',
      MM: 'MM',
      YYYY: 'yyyy',
    }[formatStr] || 'yyyy'

  return formatTZ(zonedDate, formatPattern, {
    timeZone: options.timezone,
  })
}

export const MONTH_PICKER_VARIANT = {
  select: 'select',
  carousel: 'carousel',
} as const

export type CalendarProps = Omit<ComponentProps<'div'>, 'onSelect'> & {
  selectTime?: boolean
  selectedDate?: Date
  timeStep?: number
  timezone?: string
  onSelect: (date: Date) => void
  focusedDate: Date
  onFocusedDateChange: (index: Date) => void
  labels: CalendarLabels
  monthPickerVariant?: (typeof MONTH_PICKER_VARIANT)[keyof typeof MONTH_PICKER_VARIANT]
  padding?: number
  showTimezone?: boolean
}

// This is used to maintain focus on a child element of the calendar-grid between re-renders
// When using arrow keys to move focus from a day in one month to another we are setting focus at the button for the day
// after it has changed but *only* if we *already* had focus inside the calendar grid (e.g not if focus was on the "next
// year" button, or any of the other controls)
// When moving from the last day of a month that displays 6 weeks in the grid to a month that displays 5 weeks, current
// focus gets lost on render, so this provides us with a stable element to help us preserve focus on a child element of
// the calendar grid between re-renders
const PRESERVE_FOCUS_ELEMENT = (
  <span
    data-preserve-focus
    style={{overflow: 'hidden', position: 'absolute', outline: 'none'}}
    tabIndex={-1}
  />
)

// This buttons use a specific styling, given they are intended to be aligned with the select elements.
const CALENDAR_ICON_BUTTON_PROPS = {
  padding: 2,
}

export const Calendar = forwardRef(function Calendar(
  props: CalendarProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {
    selectTime,
    onFocusedDateChange,
    selectedDate = new Date(),
    focusedDate = selectedDate,
    timeStep = 1,
    timezone,
    onSelect,
    labels,
    monthPickerVariant = 'select',
    padding = 2,
    showTimezone = false,
    ...restProps
  } = props

  const getDisplayHour = useCallback(() => {
    if (!timezone) return selectedDate.getHours()
    const zonedDate = utcToZonedTime(selectedDate, timezone)
    return zonedDate.getHours()
  }, [selectedDate, timezone])

  const getDisplayMinutes = useCallback(() => {
    if (!timezone) return selectedDate.getMinutes()
    const zonedDate = utcToZonedTime(selectedDate, timezone)
    return zonedDate.getMinutes()
  }, [selectedDate, timezone])

  const getDisplayMonth = useCallback(() => {
    return Number(format(selectedDate, 'MM', {timezone})) - 1 // month is 0-indexed
  }, [selectedDate, timezone])

  const getDisplayYear = useCallback(() => {
    return Number(format(selectedDate, 'YYYY', {timezone}))
  }, [selectedDate, timezone])
  const {timeZone} = useTimeZone()
  const {DialogTimeZone, dialogProps, dialogTimeZoneShow} = useDialogTimeZone()

  const setFocusedDate = useCallback(
    (date: Date) => onFocusedDateChange(date),
    [onFocusedDateChange],
  )

  const setFocusedDateMonth = useCallback(
    (month: number) => setFocusedDate(setDate(setMonth(focusedDate, month), 1)),
    [focusedDate, setFocusedDate],
  )

  const handleFocusedMonthChange = useCallback(
    (e: FormEvent<HTMLSelectElement>) => setFocusedDateMonth(Number(e.currentTarget.value)),
    [setFocusedDateMonth],
  )

  const moveFocusedDate = useCallback(
    (by: number) => setFocusedDate(addMonths(focusedDate, by)),
    [focusedDate, setFocusedDate],
  )

  const setFocusedDateYear = useCallback(
    (year: number) => setFocusedDate(setYear(focusedDate, year)),
    [focusedDate, setFocusedDate],
  )

  const handleDateChange = useCallback(
    (date: Date) => {
      onSelect(setMinutes(setHours(date, selectedDate.getHours()), selectedDate.getMinutes()))
    },
    [onSelect, selectedDate],
  )

  const handleMinutesChange = useCallback(
    (event: FormEvent<HTMLSelectElement>) => {
      const minutes = Number(event.currentTarget.value)
      if (!timezone) {
        onSelect(setMinutes(selectedDate, minutes))
        return
      }
      const zonedDate = utcToZonedTime(selectedDate, timezone)
      const newZonedDate = setMinutes(zonedDate, minutes)
      const utcDate = zonedTimeToUtc(newZonedDate, timezone)
      onSelect(utcDate)
    },
    [onSelect, selectedDate, timezone],
  )

  const handleHoursChange = useCallback(
    (event: FormEvent<HTMLSelectElement>) => {
      const hours = Number(event.currentTarget.value)
      if (!timezone) {
        onSelect(setHours(selectedDate, hours))
        return
      }
      const zonedDate = utcToZonedTime(selectedDate, timezone)
      const newZonedDate = setHours(zonedDate, hours)
      const utcDate = zonedTimeToUtc(newZonedDate, timezone)
      onSelect(utcDate)
    },
    [onSelect, selectedDate, timezone],
  )

  const handleTimeChange = useCallback(
    (hours: number, mins: number) => {
      if (!timezone) {
        onSelect(setHours(setMinutes(selectedDate, mins), hours))
        return
      }
      const zonedDate = utcToZonedTime(selectedDate, timezone)
      const newZonedDate = setHours(setMinutes(zonedDate, mins), hours)
      const utcDate = zonedTimeToUtc(newZonedDate, timezone)
      onSelect(utcDate)
    },
    [onSelect, selectedDate, timezone],
  )

  const ref = useRef<HTMLDivElement | null>(null)

  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(forwardedRef, () => ref.current)

  const focusCurrentWeekDay = useCallback(() => {
    ref.current?.querySelector<HTMLElement>(`[data-focused="true"]`)?.focus()
  }, [ref])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!ARROW_KEYS.includes(event.key)) {
        return
      }
      const target = event.currentTarget
      event.preventDefault()
      if (target.hasAttribute('data-calendar-grid')) {
        focusCurrentWeekDay()
        return
      }
      if (event.key === 'ArrowUp') {
        onFocusedDateChange(addDays(focusedDate, -7))
      }
      if (event.key === 'ArrowDown') {
        onFocusedDateChange(addDays(focusedDate, 7))
      }
      if (event.key === 'ArrowLeft') {
        onFocusedDateChange(addDays(focusedDate, -1))
      }
      if (event.key === 'ArrowRight') {
        onFocusedDateChange(addDays(focusedDate, 1))
      }
      // set focus temporarily on this element to make sure focus is still inside the calendar-grid after re-render
      ref.current?.querySelector<HTMLElement>('[data-preserve-focus]')?.focus()
    },
    [ref, focusCurrentWeekDay, onFocusedDateChange, focusedDate],
  )

  useEffect(() => {
    focusCurrentWeekDay()
  }, [focusCurrentWeekDay])

  useEffect(() => {
    const currentFocusInCalendarGrid = document.activeElement?.matches(
      '[data-calendar-grid], [data-calendar-grid] [data-preserve-focus]',
    )
    if (
      // Only move focus if it's currently in the calendar grid
      currentFocusInCalendarGrid
    ) {
      focusCurrentWeekDay()
    }
  }, [ref, focusCurrentWeekDay, focusedDate])

  const handleYesterdayClick = useCallback(
    () => handleDateChange(addDays(new Date(), -1)),
    [handleDateChange],
  )

  const handleTodayClick = useCallback(() => handleDateChange(new Date()), [handleDateChange])

  const handleTomorrowClick = useCallback(
    () => handleDateChange(addDays(new Date(), 1)),
    [handleDateChange],
  )

  const monthPicker = useMemo(() => {
    if (monthPickerVariant === 'carousel') {
      return (
        <Flex
          align="center"
          paddingLeft={4}
          style={{
            borderBottom: '1px solid var(--card-border-color)',
            minHeight: `55px`,
            position: 'sticky',
            top: 0,
          }}
        >
          <Flex align="center" flex={1} justify="space-between">
            <Flex align="center" flex={1}>
              <Text weight="medium" size={1}>
                {labels.monthNames[(focusedDate || new Date())?.getMonth()]}{' '}
                {(focusedDate || new Date())?.getFullYear()}
              </Text>
            </Flex>

            <Flex paddingRight={3} gap={2}>
              <TooltipDelayGroupProvider>
                <Button
                  icon={ChevronLeftIcon}
                  mode="bleed"
                  onClick={() => moveFocusedDate(-1)}
                  tooltipProps={{content: 'Previous month'}}
                />
                <Button
                  icon={ChevronRightIcon}
                  mode="bleed"
                  onClick={() => moveFocusedDate(1)}
                  tooltipProps={{content: 'Next month'}}
                />
              </TooltipDelayGroupProvider>
            </Flex>
          </Flex>
        </Flex>
      )
    }

    return (
      <Flex>
        <Box flex={1}>
          <CalendarMonthSelect
            onChange={handleFocusedMonthChange}
            monthNames={labels.monthNames}
            value={focusedDate?.getMonth()}
          />
        </Box>
        <Box marginLeft={2}>
          <CalendarYearSelect
            moveFocusedDate={moveFocusedDate}
            labels={{
              goToNextYear: labels.goToNextYear,
              goToPreviousYear: labels.goToPreviousYear,
            }}
            onChange={setFocusedDateYear}
            value={focusedDate.getFullYear()}
          />
        </Box>
      </Flex>
    )
  }, [
    focusedDate,
    handleFocusedMonthChange,
    labels.goToNextYear,
    labels.goToPreviousYear,
    labels.monthNames,
    monthPickerVariant,
    moveFocusedDate,
    setFocusedDateYear,
  ])

  const handleNowClick = useCallback(() => onSelect(new Date()), [onSelect])

  return (
    <Box data-ui="Calendar" {...restProps} ref={ref}>
      {/* Select date */}
      <Box padding={padding}>
        {/* Day presets */}
        {features.dayPresets && (
          <Grid columns={3} data-ui="CalendaryDayPresets" gap={1}>
            <Button text={labels.goToYesterday} mode="bleed" onClick={handleYesterdayClick} />
            <Button text={labels.goToToday} mode="bleed" onClick={handleTodayClick} />
            <Button text={labels.goToTomorrow} mode="bleed" onClick={handleTomorrowClick} />
          </Grid>
        )}

        {/* Select month and year */}
        <Flex>
          <Box flex={1}>
            <CalendarMonthSelect
              onChange={handleFocusedMonthChange}
              monthNames={labels.monthNames}
              value={getDisplayMonth()}
            />
          </Box>
          <Box marginLeft={2}>
            <CalendarYearSelect
              moveFocusedDate={moveFocusedDate}
              labels={{
                goToNextYear: labels.goToNextYear,
                goToPreviousYear: labels.goToPreviousYear,
              }}
              onChange={setFocusedDateYear}
              value={getDisplayYear()}
            />
          </Box>
        </Flex>

        {/* Selected month (grid of days) */}
        <Box
          data-calendar-grid
          onKeyDown={handleKeyDown}
          marginY={2}
          overflow="hidden"
          tabIndex={0}
        >
          <CalendarMonth
            weekDayNames={labels.weekDayNamesShort}
            date={focusedDate}
            focused={focusedDate}
            onSelect={handleDateChange}
            selected={selectedDate}
          />
          {PRESERVE_FOCUS_ELEMENT}
        </Box>
      </Box>

      <Box padding={2} style={{borderTop: '1px solid var(--card-border-color)'}}>
        <Flex align="center" justify="space-between">
          {/* Select time */}
          {selectTime && (
            <>
              <Flex align="center">
                <Flex align="center" flex={1}>
                  <Box>
                    <Select
                      aria-label={labels.selectHour}
                      fontSize={1}
                      padding={2}
                      radius={2}
                      value={getDisplayHour()}
                      onChange={handleHoursChange}
                    >
                      {HOURS_24.map((h) => (
                        <option key={h} value={h}>
                          {`${h}`.padStart(2, '0')}
                        </option>
                      ))}
                    </Select>
                  </Box>

                  <Box paddingX={1}>
                    <Text size={1}>:</Text>
                  </Box>

                  <Box>
                    <Select
                      aria-label={labels.selectMinute}
                      fontSize={1}
                      padding={2}
                      radius={2}
                      value={getDisplayMinutes()}
                      onChange={handleMinutesChange}
                    >
                      {range(0, 60, timeStep).map((m) => (
                        <option key={m} value={m}>
                          {`${m}`.padStart(2, '0')}
                        </option>
                      ))}
                    </Select>
                  </Box>
                </Flex>

                <Box marginLeft={2}>
                  <Button text={labels.setToCurrentTime} mode="bleed" onClick={handleNowClick} />
                </Box>
              </Flex>

              {showTimezone && (
                <Button
                  icon={EarthGlobeIcon}
                  mode="bleed"
                  size="default"
                  text={`${timeZone.abbreviation}`}
                  onClick={dialogTimeZoneShow}
                />
              )}

              {features.timePresets && (
                <Flex direction="row" justify="center" align="center" style={{marginTop: 5}}>
                  {DEFAULT_TIME_PRESETS.map(([hours, minutes]) => {
                    const text = formatTime(hours, minutes)
                    return (
                      <CalendarTimePresetButton
                        key={`${hours}-${minutes}`}
                        hours={hours}
                        minutes={minutes}
                        onTimeChange={handleTimeChange}
                        text={text}
                        aria-label={labels.setToTimePreset(text, selectedDate)}
                      />
                    )
                  })}
                </Flex>
              )}
            </>
          )}

          {showTimezone && DialogTimeZone && <DialogTimeZone {...dialogProps} />}
        </Flex>
      </Box>
    </Box>
  )
})

function CalendarTimePresetButton(props: {
  'hours': number
  'minutes': number
  'onTimeChange': (hours: number, minutes: number) => void
  'aria-label': string
  'text': string
}) {
  const {hours, minutes, text, onTimeChange} = props

  const handleClick = useCallback(() => {
    onTimeChange(hours, minutes)
  }, [hours, minutes, onTimeChange])

  return <Button text={text} aria-label={props['aria-label']} mode="bleed" onClick={handleClick} />
}

function CalendarMonthSelect(props: {
  onChange: (e: FormEvent<HTMLSelectElement>) => void
  value?: number
  monthNames: MonthNames
}) {
  const {onChange, value, monthNames} = props

  return (
    <Flex flex={1} gap={1}>
      <Box flex={1}>
        <Select fontSize={1} radius={2} value={value} onChange={onChange} padding={2}>
          {monthNames.map((monthName, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <option key={i} value={i}>
              {monthName}
            </option>
          ))}
        </Select>
      </Box>
    </Flex>
  )
}

function CalendarYearSelect(props: {
  moveFocusedDate: (by: number) => void
  onChange: (year: number) => void
  value?: number
  labels: {goToNextYear: string; goToPreviousYear: string}
}) {
  const {moveFocusedDate, onChange, value, labels} = props

  const handlePrevYearClick = useCallback(() => moveFocusedDate(-12), [moveFocusedDate])

  const handleNextYearClick = useCallback(() => moveFocusedDate(12), [moveFocusedDate])

  return (
    <Flex gap={1}>
      <Button
        aria-label={labels.goToPreviousYear}
        onClick={handlePrevYearClick}
        mode="bleed"
        icon={ChevronLeftIcon}
        tooltipProps={{content: 'Previous year'}}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Button with specific styling requirements
        {...CALENDAR_ICON_BUTTON_PROPS}
      />
      <YearInput value={value} onChange={onChange} radius={0} style={{width: 48}} />
      <Button
        aria-label={labels.goToNextYear}
        onClick={handleNextYearClick}
        mode="bleed"
        icon={ChevronRightIcon}
        tooltipProps={{content: 'Next year'}}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Button with specific styling requirements
        {...CALENDAR_ICON_BUTTON_PROPS}
      />
    </Flex>
  )
}
