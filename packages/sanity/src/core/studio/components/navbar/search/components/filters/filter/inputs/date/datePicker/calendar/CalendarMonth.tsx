import {Box, Grid, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {useTranslation} from '../../../../../../../../../../../i18n'
import {CalendarDay} from './CalendarDay'
import {SHORT_WEEK_DAY_KEYS} from './constants'
import {useCalendar} from './contexts/useDatePicker'
import {useWeeksOfMonth} from './utils'

const WEEK_DAY_NAME_KEYS = {
  // Monday is start of the week
  1: SHORT_WEEK_DAY_KEYS,

  // Saturday is start of week
  6: [...SHORT_WEEK_DAY_KEYS.slice(5), ...SHORT_WEEK_DAY_KEYS.slice(0, 5)],

  // Sunday is start of the week
  7: [SHORT_WEEK_DAY_KEYS[6], ...SHORT_WEEK_DAY_KEYS.slice(0, 6)],
}

interface CalendarMonthProps {
  hidden?: boolean
  onSelect: (date: Date) => void
}

const CustomGrid = styled(Grid)`
  grid-template-columns: repeat(7, minmax(44px, auto));
`

export function CalendarMonth({hidden, onSelect}: CalendarMonthProps) {
  const {focusedDate, firstWeekDay} = useCalendar()
  const {t} = useTranslation()

  return (
    <Box aria-hidden={hidden || false} data-ui="CalendarMonth">
      <CustomGrid gapY={1}>
        {WEEK_DAY_NAME_KEYS[firstWeekDay].map((weekdayDay) => (
          <Box key={weekdayDay} paddingBottom={3} paddingTop={2}>
            <Text align="center" size={1} weight="medium">
              {t(weekdayDay)}
            </Text>
          </Box>
        ))}

        {useWeeksOfMonth(focusedDate).map((week, weekIdx) =>
          week.days.map((weekDayDate, dayIdx) => {
            return (
              <CalendarDay key={`${weekIdx}-${dayIdx}`} date={weekDayDate} onSelect={onSelect} />
            )
          }),
        )}
      </CustomGrid>
    </Box>
  )
}
