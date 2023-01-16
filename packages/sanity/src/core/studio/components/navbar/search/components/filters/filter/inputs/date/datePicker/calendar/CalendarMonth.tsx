import {Box, Grid, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {CalendarDay} from './CalendarDay'
import {WEEK_DAY_NAMES} from './constants'
import {useCalendar} from './contexts/useDatePicker'
import {getWeeksOfMonth} from './utils'

interface CalendarMonthProps {
  hidden?: boolean
  onSelect: (date: Date) => void
}

const CustomGrid = styled(Grid)`
  grid-template-columns: repeat(7, minmax(44px, auto));
`

export function CalendarMonth({hidden, onSelect}: CalendarMonthProps) {
  const {focusedDate, fontSize} = useCalendar()

  return (
    <Box aria-hidden={hidden || false} data-ui="CalendarMonth">
      <CustomGrid>
        {WEEK_DAY_NAMES.map((weekday) => (
          <Box key={weekday} paddingBottom={3} paddingTop={2}>
            <Text align="center" size={fontSize} weight="medium">
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
      </CustomGrid>
    </Box>
  )
}
