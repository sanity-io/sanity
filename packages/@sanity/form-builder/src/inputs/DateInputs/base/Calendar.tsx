import {Box, Button, Card, Flex, Grid, Select, Text, TextInput, useForwardedRef} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {
  addDays,
  addMonths,
  isSameDay,
  setDate,
  setHours,
  setMinutes,
  setMonth,
  setYear,
} from 'date-fns'
import React from 'react'
import {range} from 'lodash'

const monthNamesShort = [
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
const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type CalendarProps = Omit<React.ComponentProps<'div'>, 'onSelect'> & {
  selectTime?: boolean
  calendars: any[]
  getDateProps: any
  getForwardProps: any
  getBackProps: any
  selectedDate: Date | null
  onSelect: (date: Date) => void
  focusedDate: Date
  onFocusedDateChange: (index: Date) => void
}

const hours = range(0, 24)
const minutes = range(0, 60, 1)

const WeekDay = styled(Button)<{today: boolean; focused: boolean}>`
  ${({today, muted, focused}) => {
    return `
      ${
        muted &&
        css`
          background-color: var(--card-shadow-penumbra-color);
          color: var(--card-muted-fg-color);
        `
      }
      ${
        today &&
        css`
          color: var(--card-focus-ring-color);
        `
      }
      ${
        focused &&
        css`
          color: var(--card-focus-ring-color);
        `
      }
    `
  }}
`

const YearInput = ({value, onChange}: {value: number; onChange: (value: number) => void}) => {
  const [inputValue, setInputValue] = React.useState<string | null>(null)

  const handleChange = React.useCallback((event) => {
    setInputValue(event.currentTarget.value)
  }, [])

  const handleBlur = (e) => {
    maybeChange(e.currentTarget.value)
  }

  const maybeChange = (currentInputValue: string) => {
    const inputAsNum = Number(currentInputValue)

    if (!isNaN(inputAsNum)) {
      if (inputValue !== null && inputAsNum !== value) {
        onChange(inputAsNum)
      }
      setInputValue(null)
    }
  }
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') {
      return
    }

    maybeChange(e.currentTarget.value)
  }

  return (
    <TextInput
      value={inputValue === null ? value : inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyPress={handleKeyPress}
      style={{width: 65}}
      inputMode="numeric"
    />
  )
}

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

export const Calendar = React.forwardRef(function Calendar(
  {
    selectTime,
    calendars,
    getBackProps,
    getForwardProps,
    getDateProps,
    onFocusedDateChange,
    focusedDate,
    selectedDate = new Date(),
    onSelect,
    ...props
  }: CalendarProps,
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

  const handleKeyDown = React.useCallback(
    (event) => {
      if (!ARROW_KEYS.includes(event.key)) {
        return
      }
      event.preventDefault()
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
    [onFocusedDateChange, focusedDate]
  )

  React.useEffect(() => {
    if (
      // Don't move focus it's currently in a container that takes input from the user (e.g. year input)
      !Array.from(ref.current?.querySelectorAll('[data-input]')).some((el) =>
        el.contains(document.activeElement)
      )
    ) {
      ref.current?.querySelector<HTMLElement>(`[data-focused="true"]`)?.focus()
    }
  }, [ref, focusedDate])

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
            {calendars.map((calendar, i) => {
              return (
                <Flex direction="column" key={i}>
                  <Flex justify="center" data-input>
                    <Flex>
                      <Box marginX={1}>
                        <Button
                          {...getBackProps({calendars})}
                          onClick={() => moveFocusedDate(-1)}
                          mode="bleed"
                          icon="chevron-left"
                        />
                      </Box>
                      <Box>
                        <Select value={calendar.month} onChange={handleFocusedMonthChange}>
                          {monthNamesShort.map((m, i) => (
                            <option key={i} value={i}>
                              {m}
                            </option>
                          ))}
                          {calendar.year}
                        </Select>
                      </Box>
                      <Box marginX={1}>
                        <Button
                          {...getForwardProps({calendars})}
                          mode="bleed"
                          icon="chevron-right"
                          onClick={() => moveFocusedDate(1)}
                        />
                      </Box>
                    </Flex>
                    <Flex>
                      <Box marginX={1}>
                        <Button
                          {...getBackProps({calendars})}
                          onClick={() => moveFocusedDate(-12)}
                          mode="bleed"
                          icon="chevron-left"
                        />
                      </Box>
                      <Box>
                        <YearInput value={Number(calendar.year)} onChange={setFocusedDateYear} />
                      </Box>
                      <Box marginX={1}>
                        <Button
                          {...getForwardProps({calendars})}
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
                        {weekdayNames.map((weekday) => (
                          <Flex key={weekday} justify="center">
                            <Text>{weekday}</Text>
                          </Flex>
                        ))}
                      </Grid>
                    </Box>
                    <Box padding={2} tabIndex={0} onKeyDown={handleKeyDown}>
                      <Flex>
                        <Grid columns={7} gap={2}>
                          {calendar.weeks.map((week, weekIdx) => {
                            return week.map((dateObj, dayIdx) => {
                              const key = `${weekIdx}${dayIdx}`
                              if (!dateObj) {
                                return <span key={key} />
                              }
                              const {
                                date,
                                selected,
                                selectable,
                                today: isToday,
                                prevMonth,
                                nextMonth,
                              } = dateObj
                              const focused = isSameDay(date, focusedDate)
                              return (
                                <WeekDay
                                  {...(focused && {'data-focused': true})}
                                  key={key}
                                  focused={focused}
                                  today={isToday}
                                  selected={selected}
                                  muted={prevMonth || nextMonth}
                                  tabIndex={-1}
                                  mode="ghost"
                                  disabled={!selectable}
                                  text={date.getDate()}
                                  onFocus={
                                    (!prevMonth || !nextMonth) &&
                                    (() => {
                                      setFocusedDate(date)
                                    })
                                  }
                                  {...getDateProps({dateObj})}
                                  onClick={() => handleDateChange(date)}
                                />
                              )
                            })
                          })}
                        </Grid>
                      </Flex>
                    </Box>
                  </Flex>
                </Flex>
              )
            })}
          </Flex>
          {selectTime && (
            <>
              <Flex direction="row" justify="center" align="center" style={{marginTop: 10}}>
                <Box>
                  <Select value={selectedDate?.getHours()} onChange={handleHoursChange}>
                    {hours.map((h) => (
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
                  <Select value={selectedDate?.getMinutes()} onChange={handleMinutesChange}>
                    {minutes.map((m) => (
                      <option key={m} value={m}>
                        {`${m}`.padStart(2, '0')}
                      </option>
                    ))}
                  </Select>
                </Box>
              </Flex>
              <Flex direction="row" justify="center" align="center" style={{marginTop: 5}}>
                <Button text="00:00" mode="bleed" size={1} onClick={() => handleTimeChange(0, 0)} />
                <Button text="06:00" mode="bleed" size={1} onClick={() => handleTimeChange(6, 0)} />
                <Button
                  text="12:00"
                  mode="bleed"
                  size={1}
                  onClick={() => handleTimeChange(12, 0)}
                />
                <Button
                  text="18:00"
                  mode="bleed"
                  size={1}
                  onClick={() => handleTimeChange(18, 0)}
                />
                <Button
                  text="23:59"
                  mode="bleed"
                  size={1}
                  onClick={() => handleTimeChange(23, 59)}
                />
              </Flex>
            </>
          )}
        </Box>
      </Flex>
    </Card>
  )
})
