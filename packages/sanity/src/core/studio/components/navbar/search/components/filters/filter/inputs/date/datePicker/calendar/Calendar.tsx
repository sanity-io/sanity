import {Box, Flex} from '@sanity/ui'
import {addDays, addMonths, formatISO, isAfter, isBefore, set} from 'date-fns'
import React, {KeyboardEvent, useCallback, useEffect, useState} from 'react'
import {useCurrentLocale} from '../../../../../../../../../../../i18n/hooks/useLocale'
import {CalendarContext} from './contexts/CalendarContext'
import {CalendarHeader} from './CalendarHeader'
import {CalendarMonth} from './CalendarMonth'
import {ARROW_KEYS} from './constants'

type CalendarProps = Omit<React.ComponentProps<'div'>, 'onSelect'> & {
  date?: Date
  endDate?: Date
  /** Date which is focused on initial mount. By default, this is the current date. */
  initialFocusedDate?: Date
  onSelect: ({date, endDate}: {date: Date | null; endDate?: Date | null}) => void
  /**
   * Whether the next date selection should update the end date.
   * Only applicable when `selectRange` is `true`.
   **/
  selectEndDate?: boolean
  /** Whether date ranges should be displayed */
  selectRange?: boolean
  selectTime?: boolean
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

export function Calendar(props: CalendarProps) {
  const {date, endDate, initialFocusedDate, onSelect, selectEndDate, selectRange, selectTime} =
    props

  const [calendarElement, setCalendarElement] = useState<HTMLElement | null>(null)
  const [focusedDate, setFocusedDate] = useState(initialFocusedDate || new Date())

  const {
    weekInfo: {firstDay: firstWeekDay},
  } = useCurrentLocale()

  const focusCurrentWeekDay = useCallback(() => {
    calendarElement?.querySelector<HTMLElement>(`[data-focused="true"]`)?.focus()
  }, [calendarElement])

  const handleDateChange = useCallback(
    (d: Date) => {
      const selectedDate = set(d, {
        hours: d.getHours(),
        minutes: d.getMinutes(),
        seconds: 0,
        milliseconds: 0,
      })

      const dateIsBeforeStartDate = date && isBefore(selectedDate, date)
      const dateIsAfterEndDate = endDate && isAfter(selectedDate, endDate)
      const dateIsOutsideRange = dateIsBeforeStartDate || dateIsAfterEndDate

      if (selectRange) {
        if (dateIsOutsideRange) {
          if (selectEndDate) {
            onSelect({
              date: dateIsBeforeStartDate ? null : date || null,
              endDate: selectedDate,
            })
          } else {
            onSelect({
              date: selectedDate,
              endDate: dateIsAfterEndDate ? null : endDate || null,
            })
          }
        } else {
          onSelect({
            date: selectEndDate ? date || null : selectedDate,
            endDate: selectEndDate ? selectedDate : endDate || null,
          })
        }
      } else {
        onSelect({date: selectedDate})
      }
    },
    [date, endDate, onSelect, selectEndDate, selectRange],
  )

  const handleNowClick = useCallback(() => {
    const now = new Date()
    if (selectRange) {
      setFocusedDate(now)
    } else {
      onSelect({date: now})
    }
  }, [onSelect, selectRange, setFocusedDate])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!ARROW_KEYS.includes(event.key)) {
        return
      }
      event.preventDefault()
      if ((event.target as HTMLElement).hasAttribute('data-calendar-grid')) {
        focusCurrentWeekDay()
        return
      }
      if (event.key === 'ArrowUp') {
        setFocusedDate(addDays(focusedDate, -7))
      }
      if (event.key === 'ArrowDown') {
        setFocusedDate(addDays(focusedDate, 7))
      }
      if (event.key === 'ArrowLeft') {
        setFocusedDate(addDays(focusedDate, -1))
      }
      if (event.key === 'ArrowRight') {
        setFocusedDate(addDays(focusedDate, 1))
      }
      // set focus temporarily on this element to make sure focus is still inside the calendar-grid after re-render
      calendarElement?.querySelector<HTMLElement>('[data-preserve-focus]')?.focus()
    },
    [calendarElement, focusCurrentWeekDay, focusedDate, setFocusedDate],
  )

  const moveFocusedDate = useCallback(
    (by: number) => setFocusedDate(addMonths(focusedDate, by)),
    [focusedDate, setFocusedDate],
  )

  useEffect(() => {
    focusCurrentWeekDay()
  }, [focusCurrentWeekDay])

  useEffect(() => {
    const currentFocusInCalendarGrid = document.activeElement?.matches(
      '[data-calendar-grid], [data-calendar-grid] [data-preserve-focus]',
    )
    // Only move focus if it's currently in the calendar grid
    if (currentFocusInCalendarGrid) {
      focusCurrentWeekDay()
    }
  }, [focusCurrentWeekDay, focusedDate])

  return (
    <CalendarContext.Provider
      value={{
        date,
        endDate,
        focusedDate,
        selectRange,
        selectTime,
        firstWeekDay,
      }}
    >
      <Box
        data-focused-date={formatISO(focusedDate, {representation: 'date'})}
        data-ui="Calendar"
        ref={setCalendarElement}
      >
        {/* Select month and year */}
        <Flex>
          <Box flex={1}>
            <CalendarHeader moveFocusedDate={moveFocusedDate} onNowClick={handleNowClick} />
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
          <CalendarMonth onSelect={handleDateChange} />
          {PRESERVE_FOCUS_ELEMENT}
        </Box>
      </Box>
    </CalendarContext.Provider>
  )
}
