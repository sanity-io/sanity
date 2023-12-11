import {addDays, eachWeekOfInterval, getWeek, lastDayOfMonth, startOfMonth} from 'date-fns'
import {useCurrentLocale} from '../../../../../i18n/hooks/useLocale'
import {TAIL_WEEKDAYS} from './constants'

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

export const formatTime = (hours: number, minutes: number): string =>
  `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}`
