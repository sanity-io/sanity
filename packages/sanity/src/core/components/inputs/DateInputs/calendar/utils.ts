import {addDays} from 'date-fns/addDays'
import {eachWeekOfInterval} from 'date-fns/eachWeekOfInterval'
import {getWeek} from 'date-fns/getWeek'
import {lastDayOfMonth} from 'date-fns/lastDayOfMonth'
import {startOfMonth} from 'date-fns/startOfMonth'

import {useCurrentLocale} from '../../../../i18n/hooks/useLocale'
import {DEFAULT_WEEK_DAY_NAMES, TAIL_WEEKDAYS} from './constants'

/**
 * NOTE: `weekStartsOn` uses 1 for Monday, 7 for Sunday. date-fns wants 0 for Sunday, 6 for Saturday.
 */
const getWeekStartsOfMonth = (date: Date, weekStartsOn: 1 | 2 | 3 | 4 | 5 | 6 | 7): Date[] => {
  const firstDay = startOfMonth(date)
  return eachWeekOfInterval(
    {
      start: firstDay,
      end: lastDayOfMonth(firstDay),
    },
    {
      weekStartsOn: weekStartsOn === 7 ? 0 : weekStartsOn,
    },
  )
}

const getWeekDaysFromWeekStarts = (weekStarts: Date[]): Date[][] => {
  return weekStarts.map((weekStart) => [
    weekStart,
    ...TAIL_WEEKDAYS.map((d) => addDays(weekStart, d)),
  ])
}

type Week = {
  number: number
  days: Date[]
}

export const useWeeksOfMonth = (date: Date): Week[] => {
  const {weekInfo} = useCurrentLocale()
  return getWeekDaysFromWeekStarts(getWeekStartsOfMonth(date, weekInfo.firstDay)).map(
    (days): Week => ({
      number: getWeek(days[0]),
      days,
    }),
  )
}

export const getWeekDayNames = (weekStartsOn: 1 | 2 | 3 | 4 | 5 | 6 | 7): readonly string[] => {
  const firstDayIndex = weekStartsOn % 7
  return [
    ...DEFAULT_WEEK_DAY_NAMES.slice(firstDayIndex),
    ...DEFAULT_WEEK_DAY_NAMES.slice(0, firstDayIndex),
  ]
}

export const formatTime = (hours: number, minutes: number): string =>
  `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}`
