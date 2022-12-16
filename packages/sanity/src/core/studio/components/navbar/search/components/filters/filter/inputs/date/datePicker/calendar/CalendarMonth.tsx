import {Box, Grid, Text} from '@sanity/ui'
import React from 'react'
import {useDatePicker} from '../contexts/useDatePicker'
import {CalendarDay} from './CalendarDay'
import {WEEK_DAY_NAMES} from './constants'
import {getWeeksOfMonth} from './utils'

interface CalendarMonthProps {
  hidden?: boolean
  onSelect: (date: Date) => void
}

export function CalendarMonth({hidden, onSelect}: CalendarMonthProps) {
  const {focusedDate, fontSize} = useDatePicker()

  return (
    <Box aria-hidden={hidden || false} data-ui="CalendarMonth">
      <Grid style={{gridTemplateColumns: 'repeat(7, minmax(44px, auto))'}}>
        {WEEK_DAY_NAMES.map((weekday) => (
          <Box key={weekday} paddingBottom={3} paddingTop={2}>
            <Text size={fontSize} weight="medium" style={{textAlign: 'center'}}>
              {weekday}
            </Text>
          </Box>
        ))}

        {getWeeksOfMonth(focusedDate).map((week, weekIdx) =>
          week.days.map((weekDayDate, dayIdx) => {
            return (
              <CalendarDay
                date={weekDayDate}
                // eslint-disable-next-line react/no-array-index-key
                key={`${weekIdx}-${dayIdx}`}
                onSelect={onSelect}
              />
            )
          })
        )}
      </Grid>
    </Box>
  )
}
