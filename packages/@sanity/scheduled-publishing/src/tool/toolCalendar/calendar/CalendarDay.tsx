import {CloseIcon} from '@sanity/icons'
import {Card, type CardTone, Text} from '@sanity/ui'
import {isWeekend} from 'date-fns'
import {useCallback} from 'react'

export interface CalendarDayProps {
  date: Date // clock time
  focused?: boolean
  onSelect: (date?: Date) => void
  isCurrentMonth?: boolean
  isToday: boolean
  selected?: boolean
  dateStyles?: React.CSSProperties
  disabled?: boolean
}

export function CalendarDay(props: CalendarDayProps) {
  const {
    date,
    focused,
    isCurrentMonth,
    isToday,
    onSelect,
    selected,
    disabled,
    dateStyles = {},
  } = props

  const handleClick = useCallback(() => {
    if (selected) {
      onSelect(undefined)
    } else {
      onSelect(date)
    }
  }, [date, onSelect, selected])

  let tone: CardTone
  if (isToday || selected) {
    tone = 'primary'
  } else if (isWeekend(date)) {
    // tone = 'transparent'
    tone = 'default'
  } else {
    tone = 'default'
  }

  return (
    <div aria-selected={selected} data-ui="CalendarDay">
      <Card
        aria-label={date.toDateString()}
        aria-pressed={selected}
        as="button"
        __unstable_focusRing
        data-weekday
        data-focused={focused ? 'true' : ''}
        data-testid={isToday ? 'day-tile-today' : `day-tile-${date.getDate()}-${date.getMonth()}`}
        role="button"
        tabIndex={-1}
        onClick={handleClick}
        paddingX={3}
        paddingY={4}
        radius={2}
        selected={selected}
        style={{position: 'relative'}}
        tone={tone}
        disabled={disabled}
      >
        <Text
          size={1}
          style={{
            opacity: !selected && !isCurrentMonth ? 0.35 : 1,
            textAlign: 'center',
            ...dateStyles,
          }}
        >
          {selected ? <CloseIcon /> : date.getDate()}
        </Text>
      </Card>
    </div>
  )
}
