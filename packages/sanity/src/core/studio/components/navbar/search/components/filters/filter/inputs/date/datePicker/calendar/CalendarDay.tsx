import {Card, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useDatePicker} from '../contexts/useDatePicker'

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

  const {fontSize} = useDatePicker()

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
          size={fontSize}
          style={{textAlign: 'center'}}
          weight="regular"
        >
          {date.getDate()}
        </Text>
      </Card>
    </div>
  )
}
