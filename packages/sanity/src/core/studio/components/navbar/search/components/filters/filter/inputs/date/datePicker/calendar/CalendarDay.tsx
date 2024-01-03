import {Card, Text, Theme} from '@sanity/ui'
import {isAfter, isBefore, isSameDay, isSameMonth} from 'date-fns'
import React, {useCallback} from 'react'
import styled, {css} from 'styled-components'
import {useCalendar} from './contexts/useDatePicker'

interface CalendarDayProps {
  date: Date
  onSelect: (date: Date) => void
}

const CircleSvg = styled.svg(({theme}: {theme: Theme}) => {
  return css`
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;

    circle {
      stroke: ${theme.sanity.color.card.enabled.border};
      stroke-width: 3;
      fill: none;
    }
  `
})

const CustomCard = styled(Card)`
  position: relative;

  &[data-focused='true'] {
    z-index: 1;
  }

  &[data-start-date='true'] {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  &[data-end-date='true'] {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  &[data-within-range='true'] {
    border-radius: 0;
  }
`

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
    <CustomCard
      __unstable_focusRing
      aria-label={date.toDateString()}
      aria-pressed={isSelected}
      data-end-date={isEndDate ? true : undefined}
      data-focused={isFocused ? 'true' : ''}
      data-ui="CalendarDay"
      aria-selected={isSelected}
      data-start-date={isStartDate ? true : undefined}
      data-within-range={isWithinRange ? true : undefined}
      forwardedAs="button"
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
          <circle cx="50" cy="50" r="40%" />
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
    </CustomCard>
  )
}
