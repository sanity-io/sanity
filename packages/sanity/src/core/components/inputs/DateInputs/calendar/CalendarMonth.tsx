import {Box, Grid, Text} from '@sanity/ui'
import {isSameDay} from 'date-fns/isSameDay'
import {isSameMonth} from 'date-fns/isSameMonth'

import {useCurrentLocale} from '../../../../i18n/hooks/useLocale'
import {CalendarDay} from './CalendarDay'
import {useWeeksOfMonth} from './utils'

interface CalendarMonthProps {
  date: Date
  focused?: Date
  selected?: Date
  onSelect: (date: Date) => void
  hidden?: boolean
  isPastDisabled?: boolean
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

  let weekDayNames: Array<string> = props.weekDayNames
  if (weekStartDay === 7) {
    weekDayNames = [props.weekDayNames[6], ...props.weekDayNames.slice(0, 6)]
  } else if (weekStartDay === 6) {
    weekDayNames = [...props.weekDayNames.slice(5), ...props.weekDayNames.slice(0, 5)]
  }

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
                key={`${weekIdx}-${dayIdx}`}
                date={date}
                focused={focused}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                onSelect={props.onSelect}
                selected={selected}
                isPastDisabled={props.isPastDisabled}
              />
            )
          }),
        )}
      </Grid>
    </Box>
  )
}
