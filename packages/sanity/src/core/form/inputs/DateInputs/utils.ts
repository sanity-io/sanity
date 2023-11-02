import type {CalendarLabels} from './base/calendar/types'

export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.valueOf())
}

export function getCalendarLabels(
  t: (key: string, values?: Record<string, unknown>) => string,
): CalendarLabels {
  return {
    goToNextMonth: t('calendar.action.go-to-next-month'),
    goToPreviousMonth: t('calendar.action.go-to-previous-month'),
    goToNextYear: t('calendar.action.go-to-next-year'),
    goToPreviousYear: t('calendar.action.go-to-previous-year'),
    setToCurrentTime: t('calendar.action.set-to-current-time'),
    selectHour: t('calendar.action.select-hour'),
    selectMinute: t('calendar.action.select-minute'),
    monthNames: [
      t('calendar.month-names.january'),
      t('calendar.month-names.february'),
      t('calendar.month-names.march'),
      t('calendar.month-names.april'),
      t('calendar.month-names.may'),
      t('calendar.month-names.june'),
      t('calendar.month-names.july'),
      t('calendar.month-names.august'),
      t('calendar.month-names.september'),
      t('calendar.month-names.october'),
      t('calendar.month-names.november'),
      t('calendar.month-names.december'),
    ],
    weekDayNamesShort: [
      t('calendar.weekday-names.short.monday'),
      t('calendar.weekday-names.short.tuesday'),
      t('calendar.weekday-names.short.wednesday'),
      t('calendar.weekday-names.short.thursday'),
      t('calendar.weekday-names.short.friday'),
      t('calendar.weekday-names.short.saturday'),
      t('calendar.weekday-names.short.sunday'),
    ],
    setToTimePreset: (time, date) => t('calendar.action.set-to-time-preset', {time, date}),
  }
}
