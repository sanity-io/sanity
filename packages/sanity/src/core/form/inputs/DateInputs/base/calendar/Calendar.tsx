import {Box, Flex, Grid, Select, Text, useForwardedRef} from '@sanity/ui'
import {ChevronLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {addDays, addMonths, setDate, setHours, setMinutes, setMonth, setYear} from 'date-fns'
import {range} from 'lodash'
import React, {forwardRef, useCallback, useEffect} from 'react'
import {Button} from '../../../../../../ui'
import {CalendarMonth} from './CalendarMonth'
import {ARROW_KEYS, DEFAULT_TIME_PRESETS, HOURS_24} from './constants'
import {features} from './features'
import {formatTime} from './utils'
import {YearInput} from './YearInput'
import {CalendarLabels, MonthNames} from './types'

type CalendarProps = Omit<React.ComponentProps<'div'>, 'onSelect'> & {
  selectTime?: boolean
  selectedDate?: Date
  timeStep?: number
  onSelect: (date: Date) => void
  focusedDate: Date
  onFocusedDateChange: (index: Date) => void
  labels: CalendarLabels
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
  fontSize: 2,
  radius: 0,
  paddingX: 2,
}

export const Calendar = forwardRef(function Calendar(
  props: CalendarProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    selectTime,
    onFocusedDateChange,
    selectedDate = new Date(),
    focusedDate = selectedDate,
    timeStep = 1,
    onSelect,
    labels,
    ...restProps
  } = props

  const setFocusedDate = useCallback(
    (date: Date) => onFocusedDateChange(date),
    [onFocusedDateChange],
  )

  const setFocusedDateMonth = useCallback(
    (month: number) => setFocusedDate(setDate(setMonth(focusedDate, month), 1)),
    [focusedDate, setFocusedDate],
  )

  const handleFocusedMonthChange = useCallback(
    (e: React.FormEvent<HTMLSelectElement>) => setFocusedDateMonth(Number(e.currentTarget.value)),
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
    (event: React.FormEvent<HTMLSelectElement>) => {
      const m = Number(event.currentTarget.value)
      onSelect(setMinutes(selectedDate, m))
    },
    [onSelect, selectedDate],
  )

  const handleHoursChange = useCallback(
    (event: React.FormEvent<HTMLSelectElement>) => {
      const m = Number(event.currentTarget.value)
      onSelect(setHours(selectedDate, m))
    },
    [onSelect, selectedDate],
  )

  const handleTimeChange = useCallback(
    (hours: number, mins: number) => {
      onSelect(setHours(setMinutes(selectedDate, mins), hours))
    },
    [onSelect, selectedDate],
  )

  const ref = useForwardedRef(forwardedRef)

  const focusCurrentWeekDay = useCallback(() => {
    ref.current?.querySelector<HTMLElement>(`[data-focused="true"]`)?.focus()
  }, [ref])

  const handleKeyDown = useCallback(
    (event: any) => {
      if (!ARROW_KEYS.includes(event.key)) {
        return
      }
      event.preventDefault()
      if (event.target.hasAttribute('data-calendar-grid')) {
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

  const handleNowClick = useCallback(() => onSelect(new Date()), [onSelect])

  return (
    <Box data-ui="Calendar" {...restProps} ref={ref}>
      {/* Select date */}
      <Box padding={2}>
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
              moveFocusedDate={moveFocusedDate}
              onChange={handleFocusedMonthChange}
              labels={{
                goToPreviousMonth: labels.goToPreviousMonth,
                goToNextMonth: labels.goToNextMonth,
              }}
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

        {/* Selected month (grid of days) */}
        <Box
          data-calendar-grid
          onKeyDown={handleKeyDown}
          marginTop={2}
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

      {/* Select time */}
      {selectTime && (
        <Box padding={2} style={{borderTop: '1px solid var(--card-border-color)'}}>
          <Flex align="center">
            <Flex align="center" flex={1}>
              <Box>
                <Select
                  aria-label={labels.selectHour}
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
                  aria-label={labels.selectMinute}
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
              <Button text={labels.setToCurrentTime} mode="bleed" onClick={handleNowClick} />
            </Box>
          </Flex>

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
        </Box>
      )}
    </Box>
  )
})

function CalendarTimePresetButton(props: {
  hours: number
  minutes: number
  onTimeChange: (hours: number, minutes: number) => void
  'aria-label': string
  text: string
}) {
  const {hours, minutes, text, onTimeChange} = props

  const handleClick = useCallback(() => {
    onTimeChange(hours, minutes)
  }, [hours, minutes, onTimeChange])

  return <Button text={text} aria-label={props['aria-label']} mode="bleed" onClick={handleClick} />
}

function CalendarMonthSelect(props: {
  moveFocusedDate: (by: number) => void
  onChange: (e: React.FormEvent<HTMLSelectElement>) => void
  value?: number
  monthNames: MonthNames
  labels: {
    goToPreviousMonth: string
    goToNextMonth: string
  }
}) {
  const {moveFocusedDate, onChange, value, labels, monthNames} = props

  const handlePrevMonthClick = useCallback(() => moveFocusedDate(-1), [moveFocusedDate])

  const handleNextMonthClick = useCallback(() => moveFocusedDate(1), [moveFocusedDate])

  return (
    <Flex flex={1}>
      <Button
        aria-label={labels.goToPreviousMonth}
        onClick={handlePrevMonthClick}
        mode="bleed"
        icon={ChevronLeftIcon}
        tooltipProps={{content: 'Previous month'}}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Button with specific styling requirements
        {...CALENDAR_ICON_BUTTON_PROPS}
      />

      <Box flex={1}>
        <Select radius={0} value={value} onChange={onChange}>
          {monthNames.map((monthName, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <option key={i} value={i}>
              {monthName}
            </option>
          ))}
        </Select>
      </Box>
      <Button
        aria-label={labels.goToNextMonth}
        mode="bleed"
        icon={ChevronRightIcon}
        onClick={handleNextMonthClick}
        tooltipProps={{content: 'Next month'}}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Button with specific styling requirements
        {...CALENDAR_ICON_BUTTON_PROPS}
      />
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
    <Flex>
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
      <YearInput value={value} onChange={onChange} radius={0} style={{width: 65}} />
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
