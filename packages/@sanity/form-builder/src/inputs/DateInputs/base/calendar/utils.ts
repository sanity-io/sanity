import {addDays, eachWeekOfInterval, getWeek, lastDayOfMonth, startOfMonth} from 'date-fns'
import {TAIL_WEEKDAYS} from './constants'

export const getWeekStartsOfMonth = (date: Date): Date[] => {
  const firstDay = startOfMonth(date)
  return eachWeekOfInterval({
    start: firstDay,
    end: lastDayOfMonth(firstDay),
  })
}

export const getWeekDaysFromWeekStarts = (weekStarts: Date[]): Date[][] => {
  return weekStarts.map((weekStart) => [
    weekStart,
    ...TAIL_WEEKDAYS.map((d) => addDays(weekStart, d)),
  ])
}

type Week = {
  number: number
  days: Date[]
}

export const getWeeksOfMonth = (date: Date): Week[] =>
  getWeekDaysFromWeekStarts(getWeekStartsOfMonth(date)).map(
    (days): Week => ({
      number: getWeek(days[0]),
      days,
    })
  )

export const formatTime = (hours: number, minutes: number): string =>
  `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}`
