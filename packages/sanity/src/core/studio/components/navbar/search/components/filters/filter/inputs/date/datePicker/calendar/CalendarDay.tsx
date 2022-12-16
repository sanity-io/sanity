import {Box, Card, Text} from '@sanity/ui'
import {isAfter, isBefore, isSameDay, isSameMonth} from 'date-fns'
import React, {useCallback} from 'react'
import styled, {css} from 'styled-components'
import {useDatePicker} from '../contexts/useDatePicker'

interface CalendarDayProps {
  date: Date
  onSelect: (date: Date) => void
}

const CustomCard = styled(Card)<{
  $isEndDate?: boolean
  $isStartDate?: boolean
  $isWithinRange?: boolean
}>(({$isEndDate, $isStartDate, $isWithinRange, theme}) => {
  const borderRadius = $isWithinRange
    ? {left: 0, right: 0}
    : {
        left: $isEndDate && !$isStartDate ? 0 : `${theme.sanity.radius[2]}px`,
        right: $isStartDate && !$isEndDate ? 0 : `${theme.sanity.radius[2]}px`,
      }
  return css`
    &[data-focused='true'] {
      z-index: 1;
    }
    border-radius: ${borderRadius.left} ${borderRadius.right} ${borderRadius.right}
      ${borderRadius.left};
    position: relative;
  `
})

const TodayHighlight = styled(Box)(({theme}) => {
  return css`
    border: 1px solid ${theme.sanity.color.card.hovered.bg};
    border-radius: ${theme.sanity.radius[2]}px;
    box-sizing: border-box;
    height: 100%;
    left: 0;
    overflow: hidden;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 1;
  `
})

export function CalendarDay({date, onSelect}: CalendarDayProps) {
  const handleClick = useCallback(() => {
    onSelect(date)
  }, [date, onSelect])

  const {
    date: selectedDate,
    endDate: selectedEndDate,
    focusedDate,
    fontSize,
    selectRange,
  } = useDatePicker()

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
    <div aria-selected={isSelected} data-ui="CalendarDay">
      <CustomCard
        __unstable_focusRing
        $isEndDate={isEndDate}
        $isStartDate={isStartDate}
        $isWithinRange={isWithinRange}
        aria-label={date.toDateString()}
        aria-pressed={isSelected}
        data-focused={isFocused ? 'true' : ''}
        forwardedAs="button"
        onClick={handleClick}
        padding={3}
        role="button"
        selected={isSelected || isStartDate || isEndDate}
        tabIndex={-1}
        tone={isWithinRange ? 'primary' : 'default'}
      >
        <Text
          muted={!isSelected && !isCurrentMonth}
          size={fontSize}
          style={{textAlign: 'center'}}
          weight={isToday ? 'semibold' : 'regular'}
        >
          {date.getDate()}
        </Text>
        {isToday && !isEndDate && !isStartDate && <TodayHighlight />}
      </CustomCard>
    </div>
  )
}
