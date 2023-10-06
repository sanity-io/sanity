import {Box, Grid, Text} from '@sanity/ui'
import {isSameDay, isSameMonth} from 'date-fns'
import React from 'react'
import {CalendarDay} from './CalendarDay'
import {getWeeksOfMonth} from './utils'

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
  return (
    <Box aria-hidden={props.hidden || false} data-ui="CalendarMonth">
      <Grid gap={1} style={{gridTemplateColumns: 'repeat(7, minmax(44px, 46px))'}}>
        {props.weekDayNames.map((weekday) => (
          <Box key={weekday} paddingY={2}>
            <Text size={1} weight="medium" style={{textAlign: 'center'}}>
              {weekday}
            </Text>
          </Box>
        ))}

        {getWeeksOfMonth(props.date).map((week, weekIdx) =>
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
