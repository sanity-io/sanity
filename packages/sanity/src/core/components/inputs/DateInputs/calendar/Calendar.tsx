import {TZDate} from '@date-fns/tz'
import {ChevronLeftIcon, ChevronRightIcon, EarthGlobeIcon} from '@sanity/icons'
import {Box, Flex, Grid, Select, Text} from '@sanity/ui'
import {format} from '@sanity/util/legacyDateFormat'
import {addDays, addMonths, parse, setDate, setHours, setMinutes, setMonth, setYear} from 'date-fns'
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
  useState,
} from 'react'

import {Button} from '../../../../../ui-components/button/Button'
import {TooltipDelayGroupProvider} from '../../../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import useDialogTimeZone from '../../../../hooks/useDialogTimeZone'
import {type TimeZoneScope, useTimeZone} from '../../../../hooks/useTimeZone'
import {TimeInput} from '../TimeInput'
import {CalendarMonth} from './CalendarMonth'
import {ARROW_KEYS, DEFAULT_TIME_PRESETS} from './constants'
import {features} from './features'
import {type CalendarLabels, type MonthNames} from './types'
import {formatTime} from './utils'
import {YearInput} from './YearInput'

/**
 * Helper function to create a TZDate from a Date's components in a specific timezone.
 * This is useful for interpreting local date/time values as being in a specific timezone.
 */
function createTZDateFromComponents(date: Date, timeZone: string): TZDate {
  return new TZDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
    timeZone,
  )
}

export const MONTH_PICKER_VARIANT = {
  select: 'select',
  carousel: 'carousel',
} as const

export type CalendarProps = Omit<ComponentProps<'div'>, 'onSelect'> & {
  selectTime?: boolean
  selectedDate: Date
  timeStep?: number
  onSelect: (date: Date) => void
  focusedDate: Date
  onFocusedDateChange: (index: Date) => void
  labels: CalendarLabels
  monthPickerVariant?: (typeof MONTH_PICKER_VARIANT)[keyof typeof MONTH_PICKER_VARIANT]
  padding?: number
  showTimeZone?: boolean
  isPastDisabled?: boolean
  timeZoneScope: TimeZoneScope
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
    selectedDate,
    focusedDate: _focusedDate,
    timeStep = 1,
    onSelect,
    labels,
    isPastDisabled,
    monthPickerVariant = 'select',
    padding = 2,
    showTimeZone = false,
    timeZoneScope,
    ...restProps
  } = props

  const focusedDate = _focusedDate ?? selectedDate

  const {timeZone} = useTimeZone(timeZoneScope)

  const [displayMonth, displayYear] = useMemo(() => {
    return [
      // month is 0-indexed
      Number(format(focusedDate, 'MM', {timeZone: timeZone?.name})) - 1,
      Number(format(focusedDate, 'YYYY', {timeZone: timeZone?.name})),
    ]
  }, [focusedDate, timeZone?.name])

  const {DialogTimeZone, dialogProps, dialogTimeZoneShow} = useDialogTimeZone(timeZoneScope)

  const [savedSelectedDate, setSavedSelectedDate] = useState<Date>(selectedDate)

  useEffect(() => {
    if (timeZone) {
      // Replicate the old date-fns-tz behavior:
      // fromZonedTime(selectedDate, tz) interprets selectedDate components as being in the timezone
      const utcDate = createTZDateFromComponents(selectedDate, timeZone.name)
      // toZonedTime(utcDate, tz) converts to timezone and returns a Date with local getters
      const tzDate = new TZDate(utcDate, timeZone.name)
      const zonedDate = new Date(
        tzDate.getFullYear(),
        tzDate.getMonth(),
        tzDate.getDate(),
        tzDate.getHours(),
        tzDate.getMinutes(),
        tzDate.getSeconds(),
        tzDate.getMilliseconds(),
      )
      setSavedSelectedDate(zonedDate)
    }
  }, [selectedDate, timeZone])

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
      const newDate = setMinutes(
        setHours(date, savedSelectedDate.getHours()),
        savedSelectedDate.getMinutes(),
      )
      if (!timeZone) {
        onSelect(newDate)
        return
      }

      // Create a TZDate in the timezone with the new date values
      // This interprets the local date/time as being in the specified timezone
      const tzDate = createTZDateFromComponents(newDate, timeZone.name)

      onSelect(tzDate)
    },
    [onSelect, savedSelectedDate, timeZone],
  )

  const handleTimeChange = useCallback(
    (hours: number, mins: number) => {
      if (!timeZone) {
        onSelect(setHours(setMinutes(savedSelectedDate, mins), hours))
        return
      }
      // Get the date in the timezone
      const zonedDate = new TZDate(savedSelectedDate, timeZone.name)
      const newZonedDate = setHours(setMinutes(zonedDate, mins), hours)
      // Create a TZDate with the new time in the timezone
      const tzDate = createTZDateFromComponents(newZonedDate, timeZone.name)
      onSelect(tzDate)
    },
    [onSelect, savedSelectedDate, timeZone],
  )

  const timeFromDate = useMemo(() => format(savedSelectedDate, 'HH:mm'), [savedSelectedDate])
  const [timeValue, setTimeValue] = useState<string | undefined>(timeFromDate)

  useEffect(() => {
    // The change is coming from another source, so we need to update the timeValue to the new value.
    // eslint-disable-next-line react-hooks/no-deriving-state-in-effects
    setTimeValue(timeFromDate)
  }, [timeFromDate])

  const handleTimeChangeInputChange = useCallback(
    (event: FormEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value
      if (value) {
        const date = parse(value, 'HH:mm', new Date())
        handleTimeChange(date.getHours(), date.getMinutes())
      } else {
        // Setting the timeValue to undefined will let the input behave correctly as a time input while the user types.
        // This means, that until it has a valid value the time input input won't emit a new onChange event.
        // but we cannot send the undefined value to the handleTimeChange, because it expects a valid date.
        setTimeValue(undefined)
      }
    },
    [handleTimeChange],
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
                  data-testid="calendar-prev-month"
                  tooltipProps={{content: 'Previous month'}}
                />
                <Button
                  icon={ChevronRightIcon}
                  mode="bleed"
                  onClick={() => moveFocusedDate(1)}
                  data-testid="calendar-next-month"
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
            value={displayMonth}
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
            value={displayYear}
          />
        </Box>
      </Flex>
    )
  }, [
    focusedDate,
    displayMonth,
    displayYear,
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
    <Box data-testid="calendar" data-ui="Calendar" {...restProps} ref={ref}>
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
        {monthPicker}

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
            selected={savedSelectedDate}
            isPastDisabled={isPastDisabled}
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
                <TimeInput
                  aria-label={labels.selectTime}
                  value={timeValue}
                  onChange={handleTimeChangeInputChange}
                  /**
                   * Values received in timeStep are defined in minutes as shown in the docs https://www.sanity.io/docs/studio/datetime-type#timestep-47de7f21-25bc-468d-b925-cd30e2690a7b
                   * the input type="time" step is in seconds, so we need to multiply by 60.
                   *
                   * The UI will show all the minutes anyways, from 0 to 59, but it rounds the value to the nearest step once blurred.
                   */
                  step={timeStep * 60}
                />
                <Box marginLeft={2}>
                  <Button text={labels.setToCurrentTime} mode="bleed" onClick={handleNowClick} />
                </Box>
              </Flex>

              {showTimeZone && (
                <Button
                  icon={EarthGlobeIcon}
                  mode="bleed"
                  size="default"
                  text={`${timeZone?.abbreviation}`}
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
                        aria-label={labels.setToTimePreset(text, savedSelectedDate)}
                      />
                    )
                  })}
                </Flex>
              )}
            </>
          )}

          {showTimeZone && DialogTimeZone && <DialogTimeZone {...dialogProps} />}
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
            // oxlint-disable-next-line no-array-index-key
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
        {...CALENDAR_ICON_BUTTON_PROPS}
      />
      <YearInput value={value} onChange={onChange} radius={0} style={{width: 48}} />
      <Button
        aria-label={labels.goToNextYear}
        onClick={handleNextYearClick}
        mode="bleed"
        icon={ChevronRightIcon}
        tooltipProps={{content: 'Next year'}}
        {...CALENDAR_ICON_BUTTON_PROPS}
      />
    </Flex>
  )
}
