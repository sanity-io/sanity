import {Box, Button, Card, Flex, Grid, Select, Text, useForwardedRef} from '@sanity/ui'
import {ChevronLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {addDays, addMonths, setDate, setHours, setMinutes, setMonth, setYear} from 'date-fns'
import {range} from 'lodash'
import React, {forwardRef, useCallback, useEffect} from 'react'
import {CalendarMonth} from './CalendarMonth'
import {ARROW_KEYS, HOURS_24, MONTH_NAMES, DEFAULT_TIME_PRESETS} from './constants'
import {features} from './features'
import {formatTime} from './utils'
import {YearInput} from './YearInput'

type CalendarProps = Omit<React.ComponentProps<'div'>, 'onSelect'> & {
  selectTime?: boolean
  selectedDate?: Date
  timeStep?: number
  onSelect: (date: Date) => void
  focusedDate: Date
  onFocusedDateChange: (index: Date) => void
}

export const Calendar = forwardRef(function Calendar(
  props: CalendarProps,
  forwardedRef: React.ForwardedRef<HTMLElement>
) {
  const {
    selectTime,
    onFocusedDateChange,
    selectedDate = new Date(),
    focusedDate = selectedDate,
    timeStep = 1,
    onSelect,
    ...restProps
  } = props

  const setFocusedDate = useCallback((date: Date) => onFocusedDateChange(date), [
    onFocusedDateChange,
  ])

  const setFocusedDateMonth = useCallback(
    (month: number) => setFocusedDate(setDate(setMonth(focusedDate, month), 1)),
    [focusedDate, setFocusedDate]
  )

  const handleFocusedMonthChange = useCallback(
    (e: React.FormEvent<HTMLSelectElement>) => setFocusedDateMonth(Number(e.currentTarget.value)),
    [setFocusedDateMonth]
  )

  const moveFocusedDate = useCallback((by: number) => setFocusedDate(addMonths(focusedDate, by)), [
    focusedDate,
    setFocusedDate,
  ])

  const setFocusedDateYear = useCallback(
    (year: number) => setFocusedDate(setYear(focusedDate, year)),
    [focusedDate, setFocusedDate]
  )

  const handleDateChange = useCallback(
    (date: Date) => {
      onSelect(setMinutes(setHours(date, selectedDate.getHours()), selectedDate.getMinutes()))
    },
    [onSelect, selectedDate]
  )

  const handleMinutesChange = useCallback(
    (event: React.FormEvent<HTMLSelectElement>) => {
      const m = Number(event.currentTarget.value)
      onSelect(setMinutes(selectedDate, m))
    },
    [onSelect, selectedDate]
  )

  const handleHoursChange = useCallback(
    (event: React.FormEvent<HTMLSelectElement>) => {
      const m = Number(event.currentTarget.value)
      onSelect(setHours(selectedDate, m))
    },
    [onSelect, selectedDate]
  )

  const handleTimeChange = useCallback(
    (hours: number, mins: number) => {
      onSelect(setHours(setMinutes(selectedDate, mins), hours))
    },
    [onSelect, selectedDate]
  )

  const ref = useForwardedRef(forwardedRef)

  const focusCurrentWeekDay = useCallback(() => {
    ref.current?.querySelector<HTMLElement>(`[data-focused="true"]`)?.focus()
  }, [ref])

  const handleKeyDown = useCallback(
    (event) => {
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
    },
    [focusCurrentWeekDay, onFocusedDateChange, focusedDate]
  )

  useEffect(() => {
    focusCurrentWeekDay()
  }, [focusCurrentWeekDay])

  useEffect(() => {
    const currentFocusInCalendarGrid = document.activeElement?.matches(
      '[data-calendar-grid] [data-weekday], [data-calendar-grid]'
    )
    if (
      // Only move focus if it's currently in the calendar grid
      currentFocusInCalendarGrid
    ) {
      focusCurrentWeekDay()
    }
  }, [ref, focusCurrentWeekDay, focusedDate])

  const handleYesterdayClick = useCallback(() => handleDateChange(addDays(new Date(), -1)), [
    handleDateChange,
  ])

  const handleTodayClick = useCallback(() => handleDateChange(new Date()), [handleDateChange])

  const handleTomorrowClick = useCallback(() => handleDateChange(addDays(new Date(), 1)), [
    handleDateChange,
  ])

  const handlePrevMonthClick = useCallback(() => moveFocusedDate(-1), [moveFocusedDate])

  const handleNextMonthClick = useCallback(() => moveFocusedDate(1), [moveFocusedDate])

  const handlePrevYearClick = useCallback(() => moveFocusedDate(-12), [moveFocusedDate])

  const handleNextYearClick = useCallback(() => moveFocusedDate(12), [moveFocusedDate])

  const handleNowClick = useCallback(() => onSelect(new Date()), [onSelect])

  return (
    <Card {...restProps} ref={ref}>
      <Flex direction="column">
        {/* Day presets */}
        {features.dayPresets && (
          <Grid columns={3} gap={1}>
            <Button text="Yesterday" mode="bleed" fontSize={1} onClick={handleYesterdayClick} />
            <Button text="Today" mode="bleed" fontSize={1} onClick={handleTodayClick} />
            <Button text="Tomorrow" mode="bleed" fontSize={1} onClick={handleTomorrowClick} />
          </Grid>
        )}

        <Box marginTop={2}>
          <Flex direction="column">
            <Flex>
              <Flex flex={1}>
                <Button
                  aria-label="Go to previous month"
                  fontSize={1}
                  onClick={handlePrevMonthClick}
                  mode="bleed"
                  icon={ChevronLeftIcon}
                  paddingX={2}
                  radius={0}
                />
                <Box flex={1}>
                  <Select
                    fontSize={1}
                    radius={0}
                    value={focusedDate?.getMonth()}
                    onChange={handleFocusedMonthChange}
                  >
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
                  fontSize={1}
                  mode="bleed"
                  icon={ChevronRightIcon}
                  onClick={handleNextMonthClick}
                  paddingX={2}
                  radius={0}
                />
              </Flex>
              <Flex>
                <Button
                  aria-label="Go to previous year"
                  fontSize={1}
                  onClick={handlePrevYearClick}
                  mode="bleed"
                  icon={ChevronLeftIcon}
                  paddingX={2}
                  radius={0}
                />
                <YearInput
                  fontSize={1}
                  value={focusedDate.getFullYear()}
                  onChange={setFocusedDateYear}
                  radius={0}
                  style={{width: 65}}
                />
                <Button
                  aria-label="Go to next year"
                  fontSize={1}
                  onClick={handleNextYearClick}
                  mode="bleed"
                  icon={ChevronRightIcon}
                  paddingX={2}
                  radius={0}
                />
              </Flex>
            </Flex>

            {/* Spacer */}
            <Box paddingTop={4} />

            <Flex
              direction="column"
              justify="space-between"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              overflow="hidden"
              data-calendar-grid
            >
              <CalendarMonth
                date={focusedDate}
                focused={focusedDate}
                onSelect={handleDateChange}
                selected={selectedDate}
              />
            </Flex>
          </Flex>

          {selectTime && (
            <Box marginTop={4}>
              <Flex direction="row" justify="center" align="center">
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
                  <Text size={3} weight="semibold">
                    :
                  </Text>
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
                <Box flex={0} paddingX={1}>
                  <Button
                    text="Now"
                    aria-label="Now"
                    mode="bleed"
                    fontSize={1}
                    onClick={handleNowClick}
                  />
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
      </Flex>
    </Card>
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
