import {Card, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {isAfter} from 'date-fns/isAfter'
import {isBefore} from 'date-fns/isBefore'
import {isSameDay} from 'date-fns/isSameDay'
import {isSameMonth} from 'date-fns/isSameMonth'
import {type ComponentProps, useCallback} from 'react'

import {circle, circleStrokeVar, circleSvg, customCard} from './CalendarDay.css'
import {useCalendar} from './contexts/useDatePicker'

interface CalendarDayProps {
  date: Date
  onSelect: (date: Date) => void
}

/** Rendered inside the day's Card so the theme read follows the Card's tone. */
function CircleSvg(props: ComponentProps<'svg'>) {
  const {className, style, ...rest} = props
  const {color} = useThemeV2()

  return (
    <svg
      {...rest}
      className={clsx(circleSvg, className)}
      style={{
        ...assignInlineVars({[circleStrokeVar]: color.selectable.default.enabled.border}),
        ...style,
      }}
    />
  )
}

export function CalendarDay({date, onSelect}: CalendarDayProps) {
  const handleClick = useCallback(() => {
    onSelect(date)
  }, [date, onSelect])

  const {date: selectedDate, endDate: selectedEndDate, focusedDate, selectRange} = useCalendar()

  const isSelected = selectedDate && isSameDay(date, selectedDate)
  const isStartDate = selectRange && selectedDate && isSameDay(date, selectedDate)
  const isEndDate = selectRange && selectedEndDate && isSameDay(date, selectedEndDate)

  const isCurrentMonth = isSameMonth(date, focusedDate)
  const isFocused = focusedDate && isSameDay(date, focusedDate)
  const isToday = isSameDay(date, new Date())

  const isWithinRange =
    selectedDate &&
    selectedEndDate &&
    !isStartDate &&
    !isEndDate &&
    isAfter(date, selectedDate) &&
    isBefore(date, selectedEndDate)

  return (
    <Card
      __unstable_focusRing
      aria-label={date.toDateString()}
      aria-pressed={isSelected}
      className={customCard}
      data-end-date={isEndDate ? true : undefined}
      data-focused={isFocused ? 'true' : ''}
      data-ui="CalendarDay"
      aria-selected={isSelected}
      data-start-date={isStartDate ? true : undefined}
      data-within-range={isWithinRange ? true : undefined}
      as="button"
      onClick={handleClick}
      paddingX={3}
      paddingY={2}
      radius={2}
      role="button"
      selected={isSelected || isStartDate || isEndDate}
      tabIndex={-1}
      tone={isWithinRange ? 'primary' : 'default'}
    >
      {isToday && (
        <CircleSvg
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          vectorEffect="non-scaling-stroke"
          viewBox="0 0 100 100"
          width="100%"
        >
          <circle className={circle} cx="50" cy="50" r="40%" />
        </CircleSvg>
      )}
      <Text
        align="center"
        muted={!isSelected && !isCurrentMonth}
        size={1}
        weight={isCurrentMonth ? 'medium' : 'regular'}
      >
        {date.getDate()}
      </Text>
    </Card>
  )
}
