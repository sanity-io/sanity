import {Box, Card, Grid, Label} from '@sanity/ui'
import {isSameDay} from 'date-fns/isSameDay'
import {isSameMonth} from 'date-fns/isSameMonth'

import {type TimeZoneScope, useTimeZone} from '../../../../hooks/useTimeZone'
import {DEFAULT_WEEK_DAY_NAMES} from '../../DateInputs/calendar/constants'
import {useWeeksOfMonth} from '../../DateInputs/calendar/utils'
import {CalendarDay as DefaultCalendarDay} from './CalendarDay'
import {type CalendarProps} from './CalendarFilter'

interface CalendarMonthProps {
  date: Date
  focused?: Date
  selected?: Date
  onSelect: (date?: Date) => void
  hidden?: boolean
  renderCalendarDay?: CalendarProps['renderCalendarDay']
  disabled?: boolean
  timeZoneScope: TimeZoneScope
}

export function CalendarMonth(props: CalendarMonthProps) {
  const {date, renderCalendarDay, hidden, disabled, timeZoneScope} = props
  const {getCurrentZoneDate} = useTimeZone(timeZoneScope)
  const CalendarDay = renderCalendarDay || DefaultCalendarDay
  const weeksOfMonth = useWeeksOfMonth(date)

  return (
    <Box aria-hidden={hidden || false} data-ui="CalendarMonth">
      <Grid
        style={{
          gridGap: '1px',
          gridTemplateColumns: 'repeat(7, 1fr)',
        }}
      >
        {/* Header */}
        {DEFAULT_WEEK_DAY_NAMES.map((weekday) => (
          <Card key={weekday} paddingY={3}>
            <Label size={1} style={{textAlign: 'center'}}>
              {weekday.slice(0, 1)}
            </Label>
          </Card>
        ))}

        {weeksOfMonth.map((week, weekIdx) =>
          week.days.map((dayDate, dayIdx) => {
            const focused = props.focused && isSameDay(dayDate, props.focused)
            const selected = props.selected && isSameDay(dayDate, props.selected)
            const isToday = isSameDay(dayDate, getCurrentZoneDate())
            const isCurrentMonth = isSameMonth(dayDate, props.focused || date)

            return (
              <CalendarDay
                key={`${weekIdx}-${dayIdx}`}
                date={dayDate}
                focused={focused}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                onSelect={props.onSelect}
                selected={selected}
                disabled={disabled}
              />
            )
          }),
        )}
      </Grid>
    </Box>
  )
}
