import {Box, Button, Card, Grid, Flex, Select, Text, TextInput, useForwardedRef} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {addDays, addMonths, isSameDay, setDate, setMonth, setYear} from 'date-fns'
import React from 'react'

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

type CalendarProps = React.ComponentProps<'div'> & {
  calendars: any[]
  getDateProps: any
  getForwardProps: any
  getBackProps: any
  offset: number
  onOffsetChange: (offset: number) => void
  focusedDate: Date
  onFocusedDateChange: (index: Date) => void
}

const WeekDay = styled(Button)<{today: boolean; focused: boolean}>`
  ${({today, muted}) => {
    return `
      ${
        muted &&
        css`
          background-color: var(--card-shadow-penumbra-color) !important;
          color: var(--card-muted-fg-color) !important;
        `
      }
      ${
        today &&
        css`
          color: var(--card-focus-ring-color) !important;
        `
      }
    `
  }}
`

const YearInput = ({value, onChange}: {value: number; onChange: (number) => void}) => {
  const handleChange = (inputValue) => {
    if (!inputValue) {
      return
    }
    const asNum = Number(inputValue)
    if (!isNaN(asNum) && asNum !== value) {
      onChange(asNum)
    }
  }

  return (
    <TextInput
      defaultValue={value}
      onBlur={(event) => {
        handleChange(event.currentTarget.value)
      }}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          handleChange(e.currentTarget.value)
        }
      }}
      style={{width: 65}}
      inputMode="numeric"
    />
  )
}

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

export const Calendar = React.forwardRef(function Calendar(
  {
    calendars,
    getBackProps,
    getForwardProps,
    getDateProps,
    onFocusedDateChange,
    focusedDate,
    ...props
  }: CalendarProps,
  forwardedRef: React.ForwardedRef<HTMLElement>
) {
  const handleMonthChange = (e) => setFocusedDateMonth(Number(e.currentTarget.value))

  const moveFocusedDate = (by) => setFocusedDate(addMonths(focusedDate, by))
  const setFocusedDateMonth = (month) => setFocusedDate(setDate(setMonth(focusedDate, month), 1))
  const setFocusedDateYear = (year) => setFocusedDate(setYear(focusedDate, year))
  const setFocusedDate = (date) => onFocusedDateChange(date)

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
      !Array.from(ref.current.querySelectorAll('[data-input]')).some((el) =>
        el.contains(document.activeElement)
      )
    ) {
      ref.current.querySelector(`[data-focused="true"]`)?.focus()
    }
  }, [ref, focusedDate])

  return (
    <Card {...props} ref={ref}>
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
                  <Select value={calendar.month} onChange={handleMonthChange}>
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
                    {...getBackProps({calendars, offset: 12})}
                    mode="bleed"
                    icon="chevron-left"
                  />
                </Box>
                <Box>
                  <YearInput value={calendar.year} onChange={setFocusedDateYear} />
                </Box>
                <Box marginX={1}>
                  <Button
                    {...getForwardProps({calendars, offset: 12})}
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
                <Grid columns={7} gap={2}>
                  {calendar.weeks.map((week, weekIdx) => {
                    return week.map((dateObj, dayIdx) => {
                      const key = `${weekIdx}${dayIdx}`
                      if (!dateObj) {
                        return <span key={key} />
                      }
                      const {date, selected, selectable, today, prevMonth, nextMonth} = dateObj
                      const focused = isSameDay(date, focusedDate)
                      return (
                        <WeekDay
                          {...(focused && {'data-focused': true})}
                          key={key}
                          focused={focused}
                          today={today}
                          selected={selected}
                          muted={prevMonth || nextMonth}
                          tabIndex={-1}
                          mode="ghost"
                          disabled={!selectable}
                          text={date.getDate()}
                          onFocus={prevMonth || nextMonth ? null : () => onFocusedDateChange(date)}
                          {...getDateProps({dateObj})}
                        />
                      )
                    })
                  })}
                </Grid>
              </Box>
            </Flex>
          </Flex>
        )
      })}
      <Flex justify="center" style={{marginTop: 10}}>
        <Button text="Today" mode="bleed" onClick={() => onFocusedDateChange(new Date())} />
      </Flex>
    </Card>
  )
})
