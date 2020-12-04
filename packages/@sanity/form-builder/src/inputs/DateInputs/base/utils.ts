import {addDays, eachWeekOfInterval, getWeek, lastDayOfMonth, startOfMonth} from 'date-fns'

// all weekdays except first
const TAIL_WEEKDAYS = [1, 2, 3, 4, 5, 6]

export const getWeekStartsOfMonth = (date: Date) => {
  const firstDay = startOfMonth(date)
  return eachWeekOfInterval({
    start: firstDay,
    end: lastDayOfMonth(firstDay),
  })
}

export const getWeekDaysFromWeekStarts = (weekStarts: Date[]) => {
  return weekStarts.map((weekStart) => [
    weekStart,
    ...TAIL_WEEKDAYS.map((d) => addDays(weekStart, d)),
  ])
}

type Week = {
  number: number
  days: Date[]
}

export const getWeeksOfMonth = (date: Date) =>
  getWeekDaysFromWeekStarts(getWeekStartsOfMonth(date)).map(
    (days): Week => ({
      number: getWeek(days[0]),
      days,
    })
  )
