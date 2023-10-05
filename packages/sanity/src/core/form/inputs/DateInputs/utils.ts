import {CalendarLabels} from './base/calendar/types'

export function isValidDate(date: Date) {
  return date instanceof Date && !isNaN(date.valueOf())
}

export function getCalendarLabels(
  t: (key: string, values?: Record<string, unknown>) => string,
): CalendarLabels {
  return {
    goToPreviousMonth: t('inputs.datetime.calendar.go-to-previous-month'),
    nextYear: t('inputs.datetime.calendar.action.next-year'),
    previousYear: t('inputs.datetime.calendar.action.previous-year'),
    setToCurrentTime: t('inputs.datetime.calendar.action.set-to-current-time'),
    selectHour: t('inputs.datetime.calendar.action.select-hour'),
    monthNames: [
      t('inputs.datetime.calendar.month-names.january'),
      t('inputs.datetime.calendar.month-names.february'),
      t('inputs.datetime.calendar.month-names.march'),
      t('inputs.datetime.calendar.month-names.april'),
      t('inputs.datetime.calendar.month-names.may'),
      t('inputs.datetime.calendar.month-names.june'),
      t('inputs.datetime.calendar.month-names.july'),
      t('inputs.datetime.calendar.month-names.august'),
      t('inputs.datetime.calendar.month-names.september'),
      t('inputs.datetime.calendar.month-names.october'),
      t('inputs.datetime.calendar.month-names.november'),
      t('inputs.datetime.calendar.month-names.december'),
    ],
    weekDayNamesShort: [
      t('inputs.datetime.calendar.weekday-names.short.monday'),
      t('inputs.datetime.calendar.weekday-names.short.tuesday'),
      t('inputs.datetime.calendar.weekday-names.short.wednesday'),
      t('inputs.datetime.calendar.weekday-names.short.thursday'),
      t('inputs.datetime.calendar.weekday-names.short.friday'),
      t('inputs.datetime.calendar.weekday-names.short.saturday'),
      t('inputs.datetime.calendar.weekday-names.short.sunday'),
    ],
    setToTimePreset: (time, date) =>
      t('inputs.datetime.calendar.action.set-to-time-preset', {time, date}),
  }
}
