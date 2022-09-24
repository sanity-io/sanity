import {Card, Text} from '@sanity/ui'
import React, {useCallback} from 'react'

interface CalendarDayProps {
  date: Date
  focused?: boolean
  onSelect: (date: Date) => void
  isCurrentMonth?: boolean
  isToday: boolean
  selected?: boolean
}

export function CalendarDay(props: CalendarDayProps) {
  const {date, focused, isCurrentMonth, isToday, onSelect, selected} = props

  const handleClick = useCallback(() => {
    onSelect(date)
  }, [date, onSelect])

  return (
    <div aria-selected={selected} data-ui="CalendarDay">
      <Card
        aria-label={date.toDateString()}
        aria-pressed={selected}
        as="button"
        __unstable_focusRing
        data-weekday
        data-focused={focused ? 'true' : ''}
        role="button"
        tabIndex={-1}
        onClick={handleClick}
        padding={3}
        radius={2}
        selected={selected}
        tone={isToday || selected ? 'primary' : 'default'}
      >
        <Text
          muted={!selected && !isCurrentMonth}
          style={{textAlign: 'center'}}
          weight={isCurrentMonth ? 'medium' : 'regular'}
        >
          {date.getDate()}
        </Text>
      </Card>
    </div>
  )
}
