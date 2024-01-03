import {Box, Grid, Text} from '@sanity/ui'
import {isSameDay, isSameMonth} from 'date-fns'
import {useCurrentLocale} from '../../../../../i18n/hooks/useLocale'
import {CalendarDay} from './CalendarDay'
import {useWeeksOfMonth} from './utils'

interface CalendarMonthProps {
  date: Date
  focused?: Date
  selected?: Date
  onSelect: (date: Date) => void
  hidden?: boolean
  weekDayNames: [
    mon: string,
    tue: string,
    wed: string,
    thu: string,
    fri: string,
    sat: string,
    sun: string,
  ]
}

export function CalendarMonth(props: CalendarMonthProps) {
  const {
    weekInfo: {firstDay: weekStartDay},
  } = useCurrentLocale()

  const weekDayNames =
    weekStartDay === 1
      ? props.weekDayNames
      : [props.weekDayNames[6], ...props.weekDayNames.slice(0, 6)]

  return (
    <Box aria-hidden={props.hidden || false} data-ui="CalendarMonth">
      <Grid gap={1} style={{gridTemplateColumns: 'repeat(7, minmax(44px, 46px))'}}>
        {weekDayNames.map((weekday) => (
          <Box key={weekday} paddingY={2}>
            <Text size={1} weight="medium" style={{textAlign: 'center'}}>
              {weekday}
            </Text>
          </Box>
        ))}

        {useWeeksOfMonth(props.date).map((week, weekIdx) =>
          week.days.map((date, dayIdx) => {
            const focused = props.focused && isSameDay(date, props.focused)
            const selected = props.selected && isSameDay(date, props.selected)
            const isToday = isSameDay(date, new Date())
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
