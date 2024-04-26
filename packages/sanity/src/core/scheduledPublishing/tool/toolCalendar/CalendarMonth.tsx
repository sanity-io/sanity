import {Box, Card, Grid, Label} from '@sanity/ui'
import {isSameDay, isSameMonth} from 'date-fns'

import useTimeZone from '../../hooks/useTimeZone'
import {CalendarDay} from './CalendarDay'
import {WEEK_DAY_NAMES} from './constants'
import {getWeeksOfMonth} from './utils'

interface CalendarMonthProps {
  date: Date
  focused?: Date
  selected?: Date
  onSelect: (date?: Date) => void
  hidden?: boolean
}

export function CalendarMonth(props: CalendarMonthProps) {
  const {getCurrentZoneDate} = useTimeZone()

  return (
    <Box aria-hidden={props.hidden || false} data-ui="CalendarMonth">
      <Grid
        style={{
          gridGap: '1px',
          gridTemplateColumns: 'repeat(7, 1fr)',
        }}
      >
        {/* Header */}
        {WEEK_DAY_NAMES.map((weekday) => {
          // Convert day name string into date.
          // `eee` assumes days are in the format 'Mon', 'Tues' etc.
          // const date = parse(weekday, 'eee', new Date())
          return (
            <Card
              key={weekday}
              paddingY={3}
              // tone={isWeekend(date) ? 'transparent' : 'default'}
            >
              <Label size={1} style={{textAlign: 'center'}}>
                {weekday.slice(0, 1)}
              </Label>
            </Card>
          )
        })}

        {getWeeksOfMonth(props.date).map((week, weekIdx) =>
          week.days.map((date, dayIdx) => {
            const focused = props.focused && isSameDay(date, props.focused)
            const selected = props.selected && isSameDay(date, props.selected)
            const isToday = isSameDay(date, getCurrentZoneDate())
            const isCurrentMonth = props.focused && isSameMonth(date, props.focused)

            return (
              <CalendarDay
                date={date}
                focused={focused}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                // eslint-disable-next-line react/no-array-index-key
                key={`${weekIdx}-${dayIdx}`}
                onSelect={props.onSelect}
                selected={selected}
              />
            )
          }),
        )}
      </Grid>
    </Box>
  )
}
