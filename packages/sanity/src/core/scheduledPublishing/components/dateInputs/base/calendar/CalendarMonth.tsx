import {Box, Grid, Text} from '@sanity/ui'
import {isSameDay, isSameMonth} from 'date-fns'

import useTimeZone from '../../../../hooks/useTimeZone'
import {CalendarDay} from './CalendarDay'
import {WEEK_DAY_NAMES} from './constants'
import {getWeeksOfMonth} from './utils'

interface CalendarMonthProps {
  date: Date
  focused?: Date
  selected?: Date
  onSelect: (date: Date) => void
  hidden?: boolean
  customValidation?: (selectedDate: Date) => boolean
}

export function CalendarMonth(props: CalendarMonthProps) {
  const {getCurrentZoneDate} = useTimeZone()
  const {customValidation} = props
  return (
    <Box aria-hidden={props.hidden || false} data-ui="CalendarMonth">
      <Grid gap={1} style={{gridTemplateColumns: 'repeat(7, minmax(44px, 46px))'}}>
        {WEEK_DAY_NAMES.map((weekday) => (
          <Box key={weekday} paddingY={2}>
            <Text size={1} weight="medium" style={{textAlign: 'center'}}>
              {weekday}
            </Text>
          </Box>
        ))}

        {/* Note: UTC dates are passed to each Calendar day but we use 'wall time' for comparison */}
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
                customValidation={customValidation}
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
