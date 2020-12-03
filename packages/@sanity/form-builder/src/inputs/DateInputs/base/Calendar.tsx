/* eslint-disable no-nested-ternary */
import {Box, Button, Card, Flex, Grid, Select, Text, useForwardedRef} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {
  addDays,
  addMonths,
  isSameDay,
  isSameMonth,
  setDate,
  setHours,
  setMinutes,
  setMonth,
  setYear,
} from 'date-fns'
import React from 'react'
import {range} from 'lodash'
import {getWeeksOfMonth} from './utils'
import {YearInput} from './YearInput'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const WEEK_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = range(0, 24)
const MINUTES = range(0, 60, 1)

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

const TIME_PRESETS = [
  [0, 0],
  [6, 0],
  [12, 0],
  [18, 0],
  [23, 59],
]

const formatTime = (hours: number, minutes: number) =>
  `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}`

const WeekDay = styled(Button)<{today: boolean}>`
  ${({today, muted}) => {
    const fg = muted
      ? '--card-muted-fg-color'
      : today
      ? '--card-focus-ring-color'
      : '--card-fg-color'
    return `
        color: var(${fg});
      ${
        muted &&
        css`
          background-color: var(--card-shadow-penumbra-color);
        `
      }
    `
  }}
`

type Props = Omit<React.ComponentProps<'div'>, 'onSelect'> & {
  selectTime?: boolean
  selectedDate?: Date
  onSelect: (date: Date) => void
  focusedDate: Date
  onFocusedDateChange: (index: Date) => void
}

export const Calendar = React.forwardRef(function Calendar(
  {
    selectTime,
    onFocusedDateChange,
    focusedDate,
    selectedDate = new Date(),
    onSelect,
    ...props
  }: Props,
  forwardedRef: React.ForwardedRef<HTMLElement>
) {
  const handleFocusedMonthChange = (e: React.FormEvent<HTMLSelectElement>) =>
    setFocusedDateMonth(Number(e.currentTarget.value))

  const moveFocusedDate = (by: number) => setFocusedDate(addMonths(focusedDate, by))
  const setFocusedDateMonth = (month: number) =>
    setFocusedDate(setDate(setMonth(focusedDate, month), 1))
  const setFocusedDateYear = (year: number) => setFocusedDate(setYear(focusedDate, year))
  const setFocusedDate = (date: Date) => onFocusedDateChange(date)

  const handleDateChange = (date: Date) => {
    onSelect(setMinutes(setHours(date, selectedDate.getHours()), selectedDate.getMinutes()))
  }

  const handleMinutesChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const m = Number(event.currentTarget.value)
    onSelect(setMinutes(selectedDate, m))
  }

  const handleHoursChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const m = Number(event.currentTarget.value)
    onSelect(setHours(selectedDate, m))
  }

  const handleTimeChange = (h, m) => {
    onSelect(setHours(setMinutes(selectedDate, m), h))
  }

  const ref = useForwardedRef(forwardedRef)

  const focusCurrentWeekDay = React.useCallback(() => {
    ref.current?.querySelector<HTMLElement>(`[data-weekday="focused"]`)?.focus()
  }, [ref])

  const handleKeyDown = React.useCallback(
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

  React.useEffect(() => {
    focusCurrentWeekDay()
  }, [focusCurrentWeekDay])

  React.useEffect(() => {
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

  const today = new Date()
  return (
    <Card {...props} ref={ref}>
      <Flex direction="column">
        <Flex justify="space-around" style={{marginBottom: 20}}>
          <Button
            text="Yesterday"
            mode="bleed"
            size={1}
            onClick={() => handleDateChange(addDays(today, -1))}
          />
          <Button text="Today" mode="bleed" size={1} onClick={() => handleDateChange(today)} />
          <Button
            text="Tomorrow"
            mode="bleed"
            size={1}
            onClick={() => handleDateChange(addDays(today, 1))}
          />
        </Flex>
        <Box>
          <Flex>
            <Flex direction="column">
              <Flex justify="center">
                <Flex>
                  <Box marginX={1}>
                    <Button
                      aria-label="Go to previous month"
                      onClick={() => moveFocusedDate(-1)}
                      mode="bleed"
                      icon="chevron-left"
                    />
                  </Box>
                  <Box>
                    <Select value={focusedDate.getMonth()} onChange={handleFocusedMonthChange}>
                      {MONTH_NAMES.map((m, i) => (
                        <option key={i} value={i}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </Box>
                  <Box marginX={1}>
                    <Button
                      aria-label="Go to next month"
                      mode="bleed"
                      icon="chevron-right"
                      onClick={() => moveFocusedDate(1)}
                    />
                  </Box>
                </Flex>
                <Flex>
                  <Box marginX={1}>
                    <Button
                      aria-label="Go to previous year"
                      onClick={() => moveFocusedDate(-12)}
                      mode="bleed"
                      icon="chevron-left"
                    />
                  </Box>
                  <Box>
                    <YearInput
                      value={focusedDate.getFullYear()}
                      onChange={setFocusedDateYear}
                      style={{width: 65}}
                    />
                  </Box>
                  <Box marginX={1}>
                    <Button
                      aria-label="Go to next year"
                      onClick={() => moveFocusedDate(12)}
                      mode="bleed"
                      icon="chevron-right"
                    />
                  </Box>
                </Flex>
              </Flex>
              <Flex direction="column">
                <Box marginTop={3} padding={2}>
                  <Grid columns={7} gap={2}>
                    {WEEK_DAY_NAMES.map((weekday) => (
                      <Flex key={weekday} justify="center">
                        <Text>{weekday}</Text>
                      </Flex>
                    ))}
                  </Grid>
                </Box>
                <Box padding={2} tabIndex={0} onKeyDown={handleKeyDown} data-calendar-grid>
                  <Flex>
                    <Grid columns={7} gap={2}>
                      {getWeeksOfMonth(focusedDate).map((week, weekIdx) =>
                        week.days.map((date, dayIdx) => {
                          const key = `${weekIdx}${dayIdx}`
                          const focused = isSameDay(date, focusedDate)
                          const selected = isSameDay(date, selectedDate)
                          return (
                            <WeekDay
                              data-weekday={focused ? 'focused' : ''}
                              key={key}
                              aria-label={date.toDateString()}
                              aria-pressed={selected}
                              role="button"
                              selected={selected}
                              tabIndex={-1}
                              mode="ghost"
                              today={isSameDay(date, today)}
                              muted={!isSameMonth(date, focusedDate)}
                              text={date.getDate()}
                              onClick={() => handleDateChange(date)}
                            />
                          )
                        })
                      )}
                    </Grid>
                  </Flex>
                </Box>
              </Flex>
            </Flex>
          </Flex>
          {selectTime && (
            <Box>
              <Flex direction="row" justify="center" align="center" style={{marginTop: 10}}>
                <Box>
                  <Select
                    aria-label="Select hour"
                    value={selectedDate?.getHours()}
                    onChange={handleHoursChange}
                  >
                    {HOURS.map((h) => (
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
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {`${m}`.padStart(2, '0')}
                      </option>
                    ))}
                  </Select>
                </Box>
              </Flex>
              <Flex direction="row" justify="center" align="center" style={{marginTop: 5}}>
                {TIME_PRESETS.map(([hours, minutes]) => {
                  const formatted = formatTime(hours, minutes)
                  return (
                    <Button
                      key={hours + minutes}
                      text={formatted}
                      aria-label={`${formatted} on ${selectedDate.toDateString()}`}
                      mode="bleed"
                      size={1}
                      onClick={() => handleTimeChange(hours, minutes)}
                    />
                  )
                })}
              </Flex>
            </Box>
          )}
        </Box>
      </Flex>
    </Card>
  )
})
