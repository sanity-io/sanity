/* eslint-disable no-nested-ternary */
import {Box, Button, Card, Flex, Grid, Select, Text, useForwardedRef} from '@sanity/ui'
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
    selectedDate = new Date(),
    focusedDate = selectedDate,
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
    ref.current?.querySelector<HTMLElement>(`[data-focused="true"]`)?.focus()
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
        <Grid columns={3} gap={1}>
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
        </Grid>
        <Box marginTop={2}>
          <Flex direction="column">
            <Flex>
              <Flex flex={1}>
                <Button
                  aria-label="Go to previous month"
                  onClick={() => moveFocusedDate(-1)}
                  mode="bleed"
                  icon="chevron-left"
                  radius={0}
                />
                <Box flex={1}>
                  <Select
                    radius={0}
                    value={focusedDate?.getMonth()}
                    onChange={handleFocusedMonthChange}
                  >
                    {MONTH_NAMES.map((m, i) => (
                      <option key={i} value={i}>
                        {m}
                      </option>
                    ))}
                  </Select>
                </Box>
                <Button
                  aria-label="Go to next month"
                  mode="bleed"
                  icon="chevron-right"
                  onClick={() => moveFocusedDate(1)}
                  radius={0}
                />
              </Flex>
              <Flex>
                <Button
                  aria-label="Go to previous year"
                  onClick={() => moveFocusedDate(-12)}
                  mode="bleed"
                  icon="chevron-left"
                  radius={0}
                />
                <YearInput
                  value={focusedDate.getFullYear()}
                  onChange={setFocusedDateYear}
                  radius={0}
                  style={{width: 65}}
                />
                <Button
                  aria-label="Go to next year"
                  onClick={() => moveFocusedDate(12)}
                  mode="bleed"
                  icon="chevron-right"
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
              <Month
                date={focusedDate}
                focused={focusedDate}
                onSelect={onSelect}
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

type MonthProps = {
  date: Date
  focused?: Date
  selected?: Date
  onSelect: (date: Date) => void
  hidden?: boolean
}
function Month(props: MonthProps) {
  const today = new Date()
  return (
    <Box aria-hidden={props.hidden || false}>
      <Grid columns={7} gap={1}>
        {WEEK_DAY_NAMES.map((weekday) => (
          <Box key={weekday} paddingY={1}>
            <Text size={1} weight="medium" style={{textAlign: 'center'}}>
              {weekday}
            </Text>
          </Box>
        ))}

        {getWeeksOfMonth(props.date).map((week, weekIdx) =>
          week.days.map((date, dayIdx) => {
            const focused = props.focused && isSameDay(date, props.focused)
            const selected = props.selected && isSameDay(date, props.selected)
            const isToday = isSameDay(date, today)
            const isCurrentMonth = props.focused && isSameMonth(date, props.focused)
            return (
              <div aria-selected={selected} key={weekIdx + dayIdx}>
                <Card
                  aria-label={date.toDateString()}
                  aria-pressed={selected}
                  as="button"
                  data-weekday
                  data-focused={focused ? 'true' : ''}
                  role="button"
                  tabIndex={-1}
                  onClick={() => props.onSelect(date)}
                  padding={3}
                  radius={2}
                  tone={isToday ? 'primary' : 'default'}
                >
                  <Text
                    muted={!isCurrentMonth}
                    style={{textAlign: 'center'}}
                    weight={isCurrentMonth ? 'medium' : 'regular'}
                  >
                    {date.getDate()}
                  </Text>
                </Card>
              </div>
            )
          })
        )}
      </Grid>
    </Box>
  )
}
