import {ChevronLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {addDays, addMonths, setHours, setMinutes} from 'date-fns'
import {
  type ComponentProps,
  type ForwardedRef,
  forwardRef,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import {Button} from '../../../../../ui-components/button/Button'
import {TooltipDelayGroupProvider} from '../../../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import useTimeZone from '../../../../scheduledPublishing/hooks/useTimeZone'
import {ARROW_KEYS, DEFAULT_MONTH_NAMES} from '../../DateInputs/calendar/constants'
import {type CalendarDayProps} from './CalendarDay'
import {CalendarMonth} from './CalendarMonth'

export type CalendarProps = Omit<ComponentProps<'div'>, 'onSelect'> & {
  focusedDate?: Date
  onSelect: (date?: Date) => void
  onFocusedDateChange?: (index: Date) => void
  selectedDate?: Date
  renderCalendarDay?: (props: CalendarDayProps) => React.ReactNode
  disabled?: boolean
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

export const CalendarFilter = forwardRef(function Calendar(
  props: CalendarProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {
    focusedDate: providedFocusedDate,
    onFocusedDateChange: handleOnFocusedDateChange,
    onSelect,
    selectedDate,
    renderCalendarDay,
    ...restProps
  } = props
  const [_focusedDate, _setFocusedDate] = useState<Date>(new Date())
  const {t: tCore} = useTranslation()
  const {zoneDateToUtc} = useTimeZone()

  const focusedDate = providedFocusedDate || _focusedDate

  const onFocusedDateChange = useCallback(
    (date: Date) => {
      if (handleOnFocusedDateChange && providedFocusedDate) {
        handleOnFocusedDateChange(date)
      } else {
        _setFocusedDate(date)
      }
    },
    [handleOnFocusedDateChange, providedFocusedDate],
  )

  const setFocusedDate = useCallback(
    (date: Date) => {
      onFocusedDateChange(zoneDateToUtc(date))
    },
    [onFocusedDateChange, zoneDateToUtc],
  )

  const moveFocusedDate = useCallback(
    (by: number) => setFocusedDate(addMonths(focusedDate, by)),
    [focusedDate, setFocusedDate],
  )

  const handleDateChange = useCallback(
    (date?: Date) => {
      if (date) {
        const targetDate = zoneDateToUtc(
          setMinutes(setHours(date, date.getHours()), date.getMinutes()),
        )
        onSelect(targetDate)
        onFocusedDateChange(targetDate)
      } else {
        onSelect(undefined)
      }
    },
    [onSelect, zoneDateToUtc, onFocusedDateChange],
  )

  const ref = useRef<HTMLDivElement | null>(null)
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(forwardedRef, () => ref.current)

  const focusCurrentWeekDay = useCallback(() => {
    ref.current?.querySelector<HTMLElement>(`[data-focused="true"]`)?.focus()
  }, [ref])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
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
    [ref, focusCurrentWeekDay, onFocusedDateChange, focusedDate, zoneDateToUtc],
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

  // Select AND focus current date when 'today' is pressed
  const handleNowClick = useCallback(() => {
    const now = new Date()
    onSelect(now)
    onFocusedDateChange(now)
  }, [onSelect, onFocusedDateChange])

  const handlePrevMonthClick = useCallback(() => moveFocusedDate(-1), [moveFocusedDate])

  const handleNextMonthClick = useCallback(() => moveFocusedDate(1), [moveFocusedDate])

  return (
    <Box data-ui="Calendar" {...restProps} ref={ref}>
      {/* Month + Year header */}
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
          <Text weight="medium" size={1}>
            {DEFAULT_MONTH_NAMES[focusedDate?.getMonth()]} {focusedDate?.getFullYear()}
          </Text>
          <Flex paddingRight={3} gap={2}>
            <TooltipDelayGroupProvider>
              <Button
                icon={ChevronLeftIcon}
                mode="bleed"
                onClick={handlePrevMonthClick}
                tooltipProps={{content: 'Previous month'}}
                disabled={restProps.disabled}
              />
              <Button
                icon={ChevronRightIcon}
                mode="bleed"
                onClick={handleNextMonthClick}
                tooltipProps={{content: 'Next month'}}
                disabled={restProps.disabled}
              />
            </TooltipDelayGroupProvider>
          </Flex>
        </Flex>
      </Flex>

      {/* Select date */}
      <Box>
        {/* Selected month (grid of days) */}
        <Box
          data-calendar-grid
          onKeyDown={handleKeyDown}
          overflow="hidden"
          paddingBottom={1}
          paddingX={1}
          tabIndex={0}
        >
          <CalendarMonth
            date={focusedDate}
            focused={providedFocusedDate}
            onSelect={handleDateChange}
            selected={selectedDate}
            renderCalendarDay={renderCalendarDay}
            disabled={restProps.disabled}
          />
          {PRESERVE_FOCUS_ELEMENT}
        </Box>
      </Box>

      {/* Today button */}
      <Box flex={1} style={{borderBottom: '1px solid var(--card-border-color)'}}>
        <Button
          disabled={restProps.disabled}
          mode="bleed"
          onClick={handleNowClick}
          width="fill"
          aria-label={tCore('calendar.action.go-to-today-aria-label')}
          text={tCore('calendar.action.go-to-today')}
        />
      </Box>
    </Box>
  )
})
