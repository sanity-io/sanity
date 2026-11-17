import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'
import {Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {LocaleProvider} from '../../../i18n/components/LocaleProvider'
import {CalendarDay as FilterCalendarDay} from '../DateFilters/calendar/CalendarDay'
import {CalendarFilter} from '../DateFilters/calendar/CalendarFilter'
import {CalendarMonth as FilterCalendarMonth} from '../DateFilters/calendar/CalendarMonth'
import {Calendar} from '../DateInputs/calendar/Calendar'
import {CalendarDay} from '../DateInputs/calendar/CalendarDay'
import {CalendarMonth} from '../DateInputs/calendar/CalendarMonth'
import {type CalendarLabels} from '../DateInputs/calendar/types'
import {YearInput} from '../DateInputs/calendar/YearInput'
import {DateTimeInput} from '../DateInputs/DateTimeInput'
import {LazyTextInput} from '../DateInputs/LazyTextInput'
import {TimeInput} from '../DateInputs/TimeInput'

// Every calendar shows January 2024, so the real "today" never falls inside the rendered month
// and no day is highlighted as the current one.
const SELECTED = new Date('2024-01-15T10:00:00.000Z')
const FOCUSED = new Date('2024-01-22T10:00:00.000Z')
const WEEKEND = new Date('2024-01-20T10:00:00.000Z')

const TIME_ZONE_SCOPE = {type: 'input', id: 'date-inputs-story'} as const

const WEEK_DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const LABELS: CalendarLabels = {
  ariaLabel: 'Select date',
  goToTomorrow: 'Tomorrow',
  goToToday: 'Today',
  goToYesterday: 'Yesterday',
  goToPreviousYear: 'Previous year',
  goToNextYear: 'Next year',
  goToPreviousMonth: 'Previous month',
  goToNextMonth: 'Next month',
  selectTime: 'Select time',
  setToCurrentTime: 'Set to current time',
  tooltipText: 'Calendar tooltip',
  monthNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  weekDayNamesShort: [...WEEK_DAY_NAMES],
  setToTimePreset: (time: string) => `Set to ${time}`,
}

function Section(props: {title: string; children: ReactNode}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {props.title}
      </Text>
      {props.children}
    </VStack>
  )
}

/**
 * The date and datetime input family from `core/components/inputs`: the full `Calendar` with
 * and without time selection, a bare `CalendarMonth` and `CalendarDay`, the `YearInput`,
 * `TimeInput` and `LazyTextInput` primitives, the closed `DateTimeInput` in its states, and the
 * search filter calendar (`CalendarFilter`, `CalendarMonth`, `CalendarDay`). Every value is
 * pinned to January 2024 so the rendered month never contains the real "today". The calendars
 * read the current locale for week-start information, which `TestWrapper` does not mount, so
 * the studio `LocaleProvider` sits on top of the mock source.
 */
export function DateInputsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <LocaleProvider>
        <Card padding={4} style={{maxWidth: 720}}>
          <VStack gap={5}>
            <Section title="calendar: date only (carousel month picker), with time (select month picker)">
              <Flex gap={4} flexWrap="wrap">
                <Card border radius={2}>
                  <Calendar
                    labels={LABELS}
                    monthPickerVariant="carousel"
                    onSelect={noop}
                    padding={3}
                    timeZoneScope={TIME_ZONE_SCOPE}
                    value={SELECTED}
                  />
                </Card>
                <Card border radius={2}>
                  <Calendar
                    labels={LABELS}
                    monthPickerVariant="select"
                    onSelect={noop}
                    padding={3}
                    selectTime
                    showTimeZone
                    timeStep={15}
                    timeZoneScope={TIME_ZONE_SCOPE}
                    value={SELECTED}
                  />
                </Card>
              </Flex>
            </Section>

            <Section title="calendar: past disabled">
              <Card border radius={2} style={{width: 'fit-content'}}>
                <Calendar
                  isPastDisabled
                  labels={LABELS}
                  onSelect={noop}
                  padding={3}
                  timeZoneScope={TIME_ZONE_SCOPE}
                  value={SELECTED}
                />
              </Card>
            </Section>

            <Section title="calendar month alone (selected 15th, focused 22nd), single days">
              <Flex gap={4} alignItems="flex-start" flexWrap="wrap">
                <Card border padding={2} radius={2} style={{width: 'fit-content'}}>
                  <CalendarMonth
                    date={SELECTED}
                    focused={FOCUSED}
                    onSelect={noop}
                    selected={SELECTED}
                    weekDayNames={[...WEEK_DAY_NAMES]}
                  />
                </Card>
                <Flex gap={1}>
                  <CalendarDay date={SELECTED} isToday={false} onSelect={noop} selected />
                  <CalendarDay date={FOCUSED} focused isToday={false} onSelect={noop} />
                  <CalendarDay date={WEEKEND} isToday onSelect={noop} />
                  <CalendarDay
                    date={WEEKEND}
                    isCurrentMonth={false}
                    isToday={false}
                    onSelect={noop}
                  />
                  <CalendarDay date={SELECTED} isPastDisabled isToday={false} onSelect={noop} />
                </Flex>
              </Flex>
            </Section>

            <Section title="year input, time input, lazy text input (value, placeholder, disabled)">
              <Flex gap={3} flexWrap="wrap">
                <YearInput aria-label="Year" onChange={noop} value="2024" />
                <TimeInput aria-label="Time" onChange={noop} value="10:00" />
                <LazyTextInput aria-label="Lazy" onChange={noop} value="2024-01-15" />
                <LazyTextInput aria-label="Lazy empty" onChange={noop} placeholder="YYYY-MM-DD" />
                <LazyTextInput
                  aria-label="Lazy disabled"
                  disabled
                  onChange={noop}
                  value="2024-01-15"
                />
              </Flex>
            </Section>

            <Section title="date time input: value, placeholder, read-only, invalid, input disabled">
              <VStack gap={2}>
                <DateTimeInput
                  calendarLabels={LABELS}
                  inputValue="2024-01-15 10:00"
                  onChange={noop}
                  selectTime
                  timeZoneScope={TIME_ZONE_SCOPE}
                  value={SELECTED}
                />
                <DateTimeInput
                  calendarLabels={LABELS}
                  onChange={noop}
                  placeholder="Pick a date"
                  timeZoneScope={TIME_ZONE_SCOPE}
                />
                <DateTimeInput
                  calendarLabels={LABELS}
                  inputValue="2024-01-15"
                  onChange={noop}
                  readOnly
                  timeZoneScope={TIME_ZONE_SCOPE}
                  value={SELECTED}
                />
                <DateTimeInput
                  calendarLabels={LABELS}
                  customValidity="Must be a valid date"
                  inputValue="not a date"
                  onChange={noop}
                  timeZoneScope={TIME_ZONE_SCOPE}
                />
                <DateTimeInput
                  calendarLabels={LABELS}
                  disableInput
                  inputValue="2024-01-15 10:00"
                  onChange={noop}
                  selectTime
                  showTimeZone
                  timeZoneScope={TIME_ZONE_SCOPE}
                  value={SELECTED}
                />
              </VStack>
            </Section>

            <Section title="search filter calendar (selected 15th, focused 22nd), disabled">
              <Flex gap={4} alignItems="flex-start" flexWrap="wrap">
                <Card border radius={2} style={{width: 'fit-content'}}>
                  <CalendarFilter
                    focusedDate={FOCUSED}
                    onSelect={noop}
                    selectedDate={SELECTED}
                    timeZoneScope={TIME_ZONE_SCOPE}
                  />
                </Card>
                <Card border radius={2} style={{width: 'fit-content'}}>
                  <CalendarFilter
                    disabled
                    focusedDate={FOCUSED}
                    onSelect={noop}
                    selectedDate={SELECTED}
                    timeZoneScope={TIME_ZONE_SCOPE}
                  />
                </Card>
              </Flex>
            </Section>

            <Section title="search filter month alone, single filter days (selected, focused, weekend, disabled)">
              <Flex gap={4} alignItems="flex-start" flexWrap="wrap">
                <Card border padding={2} radius={2} style={{width: 'fit-content'}}>
                  <FilterCalendarMonth
                    date={SELECTED}
                    focused={FOCUSED}
                    onSelect={noop}
                    selected={SELECTED}
                    timeZoneScope={TIME_ZONE_SCOPE}
                  />
                </Card>
                <Flex gap={1}>
                  <FilterCalendarDay date={SELECTED} isToday={false} onSelect={noop} selected />
                  <FilterCalendarDay date={FOCUSED} focused isToday={false} onSelect={noop} />
                  <FilterCalendarDay date={WEEKEND} isToday={false} onSelect={noop} />
                  <FilterCalendarDay date={SELECTED} isToday onSelect={noop} />
                  <FilterCalendarDay
                    date={SELECTED}
                    isCurrentMonth={false}
                    isToday={false}
                    onSelect={noop}
                  />
                  <FilterCalendarDay date={SELECTED} disabled isToday={false} onSelect={noop} />
                </Flex>
              </Flex>
            </Section>
          </VStack>
        </Card>
      </LocaleProvider>
    </TestWrapper>
  )
}
