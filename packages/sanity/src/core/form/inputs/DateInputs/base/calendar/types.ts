export interface CalendarLabels {
  previousYear: string
  nextYear: string
  goToPreviousMonth: string
  selectHour: string
  setToCurrentTime: string
  montNames: MonthNames
  weekDayNames: WeekDayNames
  setToTimePreset: (time: string, date: Date) => string
}

export type WeekDayNames = [
  mon: string,
  tue: string,
  wed: string,
  thu: string,
  fri: string,
  sat: string,
  sun: string,
]

export type MonthNames = [
  jan: string,
  feb: string,
  mar: string,
  apr: string,
  may: string,
  jun: string,
  jul: string,
  aug: string,
  sept: string,
  oct: string,
  nov: string,
  dec: string,
]
