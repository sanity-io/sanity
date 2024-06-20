import {ChevronLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button,
  Flex,
  Select,
  Text,
} from '@sanity/ui'
import {addDays, addMonths, setDate, setHours, setMinutes, setMonth, setYear} from 'date-fns'
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
  useRef,
} from 'react'

import useTimeZone from '../../../../hooks/useTimeZone'
import {CalendarMonth} from './CalendarMonth'
import {ARROW_KEYS, DEFAULT_TIME_PRESETS, HOURS_24, MONTH_NAMES} from './constants'
import {features} from './features'
import {formatTime} from './utils'
import {YearInput} from './YearInput'

export type CalendarProps = Omit<ComponentProps<'div'>, 'onSelect'> & {
  selectTime?: boolean
  selectedDate?: Date
  timeStep?: number
  onSelect: (date: Date) => void
  focusedDate: Date
  onFocusedDateChange: (index: Date) => void
  customValidation?: (selectedDate: Date) => boolean
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

export const Calendar = forwardRef(function Calendar(
  props: CalendarProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {getCurrentZoneDate, zoneDateToUtc} = useTimeZone()

  const {
    selectTime,
    onFocusedDateChange,
    selectedDate = getCurrentZoneDate(),
    focusedDate = selectedDate,
    timeStep = 1,
    onSelect,
    customValidation,
    ...restProps
  } = props

  const setFocusedDate = useCallback(
    (date: Date) => onFocusedDateChange(zoneDateToUtc(date)),
    [onFocusedDateChange, zoneDateToUtc],
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
      onSelect(
        zoneDateToUtc(
          setMinutes(setHours(date, selectedDate.getHours()), selectedDate.getMinutes()),
        ),
      )
    },
    [onSelect, selectedDate, zoneDateToUtc],
  )

  const handleMinutesChange = useCallback(
    (event: FormEvent<HTMLSelectElement>) => {
      const m = Number(event.currentTarget.value)
      onSelect(zoneDateToUtc(setMinutes(selectedDate, m)))
    },
    [onSelect, selectedDate, zoneDateToUtc],
  )

  const handleHoursChange = useCallback(
    (event: FormEvent<HTMLSelectElement>) => {
      const m = Number(event.currentTarget.value)
      onSelect(zoneDateToUtc(setHours(selectedDate, m)))
    },
    [onSelect, selectedDate, zoneDateToUtc],
  )

  const handleTimeChange = useCallback(
    (hours: number, mins: number) => {
      onSelect(zoneDateToUtc(setHours(setMinutes(selectedDate, mins), hours)))
    },
    [onSelect, selectedDate, zoneDateToUtc],
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
      event.preventDefault()
      if (event.currentTarget.hasAttribute('data-calendar-grid')) {
        focusCurrentWeekDay()
        return
      }
      if (event.key === 'ArrowUp') {
        onFocusedDateChange(zoneDateToUtc(addDays(focusedDate, -7)))
      }
      if (event.key === 'ArrowDown') {
        onFocusedDateChange(zoneDateToUtc(addDays(focusedDate, 7)))
      }
      if (event.key === 'ArrowLeft') {
        onFocusedDateChange(zoneDateToUtc(addDays(focusedDate, -1)))
      }
      if (event.key === 'ArrowRight') {
        onFocusedDateChange(zoneDateToUtc(addDays(focusedDate, 1)))
      }
      // set focus temporarily on this element to make sure focus is still inside the calendar-grid after re-render
      ref.current?.querySelector<HTMLElement>('[data-preserve-focus]')?.focus()
    },
    [zoneDateToUtc, ref, focusCurrentWeekDay, onFocusedDateChange, focusedDate],
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

  const handleNowClick = useCallback(() => onSelect(new Date()), [onSelect])

  return (
    <Box data-ui="Calendar" {...restProps} ref={ref}>
      {/* Select date */}
      <Box padding={2}>
        {/* Select month and year */}
        <Flex>
          <Box flex={1}>
            <CalendarMonthSelect
              moveFocusedDate={moveFocusedDate}
              onChange={handleFocusedMonthChange}
              value={focusedDate?.getMonth()}
            />
          </Box>
          <Box marginLeft={2}>
            <CalendarYearSelect
              moveFocusedDate={moveFocusedDate}
              onChange={setFocusedDateYear}
              value={focusedDate.getFullYear()}
            />
          </Box>
        </Flex>

        {/* Selected month (grid of days) */}
        <Box
          data-calendar-grid
          onKeyDown={handleKeyDown}
          marginTop={2}
          overflow="hidden"
          tabIndex={0}
        >
          <CalendarMonth
            date={focusedDate}
            focused={focusedDate}
            customValidation={customValidation}
            onSelect={handleDateChange}
            selected={selectedDate}
          />
          {PRESERVE_FOCUS_ELEMENT}
        </Box>
      </Box>

      {/* Select time */}
      {selectTime && (
        <Box padding={2} style={{borderTop: '1px solid var(--card-border-color)'}}>
          <Flex align="center">
            <Flex align="center" flex={1}>
              <Box>
                <Select
                  aria-label="Select hour"
                  value={selectedDate?.getHours()}
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
                <Text>:</Text>
              </Box>

              <Box>
                <Select
                  aria-label="Select minutes"
                  value={selectedDate?.getMinutes()}
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
              <Button text="Set to current time" mode="bleed" onClick={handleNowClick} />
            </Box>
          </Flex>

          {features.timePresets && (
            <Flex direction="row" justify="center" align="center" style={{marginTop: 5}}>
              {DEFAULT_TIME_PRESETS.map(([hours, minutes]) => {
                return (
                  <CalendarTimePresetButton
                    key={`${hours}-${minutes}`}
                    hours={hours}
                    minutes={minutes}
                    onTimeChange={handleTimeChange}
                    selectedDate={selectedDate}
                  />
                )
              })}
            </Flex>
          )}
        </Box>
      )}
    </Box>
  )
})

function CalendarTimePresetButton(props: {
  hours: number
  minutes: number
  onTimeChange: (hours: number, minutes: number) => void
  selectedDate: Date
}) {
  const {hours, minutes, onTimeChange, selectedDate} = props
  const formatted = formatTime(hours, minutes)

  const handleClick = useCallback(() => {
    onTimeChange(hours, minutes)
  }, [hours, minutes, onTimeChange])

  return (
    <Button
      text={formatted}
      aria-label={`${formatted} on ${selectedDate.toDateString()}`}
      mode="bleed"
      fontSize={1}
      onClick={handleClick}
    />
  )
}

function CalendarMonthSelect(props: {
  moveFocusedDate: (by: number) => void
  onChange: (e: FormEvent<HTMLSelectElement>) => void
  value?: number
}) {
  const {moveFocusedDate, onChange, value} = props

  const handlePrevMonthClick = useCallback(() => moveFocusedDate(-1), [moveFocusedDate])

  const handleNextMonthClick = useCallback(() => moveFocusedDate(1), [moveFocusedDate])

  return (
    <Flex flex={1}>
      <Button
        aria-label="Go to previous month"
        onClick={handlePrevMonthClick}
        mode="bleed"
        icon={ChevronLeftIcon}
        paddingX={2}
        radius={0}
      />
      <Box flex={1}>
        <Select radius={0} value={value} onChange={onChange}>
          {MONTH_NAMES.map((m, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <option key={i} value={i}>
              {m}
            </option>
          ))}
        </Select>
      </Box>
      <Button
        aria-label="Go to next month"
        mode="bleed"
        icon={ChevronRightIcon}
        onClick={handleNextMonthClick}
        paddingX={2}
        radius={0}
      />
    </Flex>
  )
}

function CalendarYearSelect(props: {
  moveFocusedDate: (by: number) => void
  onChange: (year: number) => void
  value?: number
}) {
  const {moveFocusedDate, onChange, value} = props

  const handlePrevYearClick = useCallback(() => moveFocusedDate(-12), [moveFocusedDate])

  const handleNextYearClick = useCallback(() => moveFocusedDate(12), [moveFocusedDate])

  return (
    <Flex>
      <Button
        aria-label="Previous year"
        onClick={handlePrevYearClick}
        mode="bleed"
        icon={ChevronLeftIcon}
        paddingX={2}
        radius={0}
      />
      <YearInput value={value} onChange={onChange} radius={0} style={{width: 65}} />
      <Button
        aria-label="Next year"
        onClick={handleNextYearClick}
        mode="bleed"
        icon={ChevronRightIcon}
        paddingX={2}
        radius={0}
      />
    </Flex>
  )
}
