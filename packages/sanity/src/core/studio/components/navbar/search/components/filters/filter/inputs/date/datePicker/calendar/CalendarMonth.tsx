import {Box, Grid, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {useTranslation} from '../../../../../../../../../../../i18n'
import {CalendarDay} from './CalendarDay'
import {SHORT_WEEK_DAY_KEYS} from './constants'
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
  const {t} = useTranslation()

  return (
    <Box aria-hidden={hidden || false} data-ui="CalendarMonth">
      <CustomGrid>
        {SHORT_WEEK_DAY_KEYS.map((weekdayDay) => (
          <Box key={weekdayDay} paddingBottom={3} paddingTop={2}>
            <Text align="center" size={fontSize} weight="medium">
              {t(weekdayDay)}
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
          }),
        )}
      </CustomGrid>
    </Box>
  )
}
