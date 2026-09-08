import {Card, Grid, Label} from '@sanity/ui'
import {isSameDay} from 'date-fns/isSameDay'
import {isSameMonth} from 'date-fns/isSameMonth'
import {Box} from 'ui5'

import {type TimeZoneScope, useTimeZone} from '../../../../hooks/useTimeZone'
import {useCurrentLocale} from '../../../../i18n/hooks/useLocale'
import {getWeekDayNames, useWeeksOfMonth} from '../../DateInputs/calendar/utils'
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
  const {
    weekInfo: {firstDay},
  } = useCurrentLocale()
  const weekDayNames = getWeekDayNames(firstDay)

  return (
    <Box aria-hidden={hidden || false} data-ui="CalendarMonth">
      <Grid
        style={{
          gap: '1px',
          gridTemplateColumns: 'repeat(7, 1fr)',
        }}
      >
        {/* Header */}
        {weekDayNames.map((weekday) => (
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
