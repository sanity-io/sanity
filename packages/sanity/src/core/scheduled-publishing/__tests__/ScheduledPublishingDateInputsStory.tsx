import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type ReactNode} from 'react'
import {Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {LocaleProvider} from '../../i18n/components/LocaleProvider'
import {Calendar} from '../components/dateInputs/base/calendar/Calendar'
import {CalendarDay} from '../components/dateInputs/base/calendar/CalendarDay'
import {DateTimeInput} from '../components/dateInputs/base/DateTimeInput'
import {CommonDateTimeInput} from '../components/dateInputs/CommonDateTimeInput'
import {DateTimeInput as ScheduleDateTimeInput} from '../components/dateInputs/DateTimeInput'
import {type ParseResult} from '../components/dateInputs/types'
import DialogHeader from '../components/dialogs/DialogHeader'
import TimeZoneButtonElementQuery from '../components/dialogs/TimeZoneButtonElementQuery'
import ScheduleForm from '../components/editScheduleForm/ScheduleForm'
import MenuItemWithPermissionsTooltip from '../components/scheduleContextMenu/MenuItemWithPermissionsTooltip'
import DateWithTooltip from '../components/scheduleItem/dateWithTooltip/DateWithTooltip'
import DateWithTooltipElementQuery from '../components/scheduleItem/dateWithTooltip/DateWithTooltipElementQuery'
import {
  SCHEDULE_STATE_DICTIONARY,
  SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE,
  TOOL_TITLE,
} from '../constants'
import {SchedulesProvider} from '../tool/contexts/schedules'
import {Schedules} from '../tool/schedules/Schedules'
import {CalendarDay as ToolCalendarDay} from '../tool/toolCalendar/CalendarDay'
import Pip from '../tool/toolCalendar/Pip'
import {type Schedule, type ScheduleState} from '../types'

// Every calendar shows January 2024, so the real "today" never falls inside the rendered month
// and no day is highlighted as the current one.
const SELECTED = new Date('2024-01-15T10:00:00.000Z')
const FOCUSED = new Date('2024-01-22T10:00:00.000Z')
const WEEKEND = new Date('2024-01-20T10:00:00.000Z')
const SELECTED_ISO = SELECTED.toISOString()

const noop = () => undefined

const SCHEDULE_BASE: Omit<Schedule, 'id' | 'state'> = {
  author: 'doug',
  action: 'publish',
  createdAt: '2024-01-01T09:00:00.000Z',
  dataset: 'production',
  description: '',
  documents: [{documentId: 'article-fixture', documentType: 'article'}],
  executeAt: SELECTED_ISO,
  name: 'Schedule fixture',
  projectId: 'ppsg7ml5',
  stateReason: '',
}

// One schedule per state, all on the selected day, so the tool calendar day renders every pip.
const SCHEDULES: Schedule[] = [
  {...SCHEDULE_BASE, id: 'schedule-upcoming', state: 'scheduled'},
  {...SCHEDULE_BASE, id: 'schedule-completed', state: 'succeeded', executedAt: SELECTED_ISO},
  {...SCHEDULE_BASE, id: 'schedule-failed', state: 'cancelled', stateReason: 'Document deleted'},
]

const SCHEDULE_STATES: ScheduleState[] = ['scheduled', 'succeeded', 'cancelled']

function parseInputValue(inputValue: string): ParseResult {
  const date = new Date(inputValue)
  return Number.isNaN(date.getTime())
    ? {isValid: false, error: 'Invalid date'}
    : {isValid: true, date}
}

function formatInputValue(date: Date): string {
  return date.toISOString().slice(0, 16).replace('T', ' ')
}

function serialize(date: Date): string {
  return date.toISOString()
}

function Section(props: {title: string; children: ReactNode}) {
  const {title, children} = props
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {title}
      </Text>
      {children}
    </VStack>
  )
}

/**
 * Chromatic sentinel for the scheduled-publishing date inputs and the tool
 * calendar: the base `Calendar` with and without time selection, bare calendar
 * days, the closed datetime inputs (base, common and the schema-driven
 * wrapper), the edit-schedule form, the dialog header with its time zone
 * button element query, the element-queried date with tooltip, the tool
 * calendar day with every pip and the empty schedules panel. Dates are pinned
 * to January 2024; the schedules list is a local fixture, nothing is fetched.
 */
export function ScheduledPublishingDateInputsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <LocaleProvider>
        <Card padding={4}>
          <VStack gap={5}>
            <Section title="dialog header">
              <DialogHeader
                title="Schedule publishing"
                timeZoneScope={SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE}
              />
              <TimeZoneButtonElementQuery>
                <Text size={1} as="div" trim={true}>
                  Element query wrapper without a button
                </Text>
              </TimeZoneButtonElementQuery>
            </Section>

            <Section title="date with tooltip">
              <DateWithTooltipElementQuery>
                <DateWithTooltip date={SELECTED} useElementQueries />
              </DateWithTooltipElementQuery>
              <DateWithTooltip date={SELECTED} />
            </Section>

            <Section title="constants">
              <Flex gap={3} flexWrap="wrap">
                <Text size={1} weight="medium" as="div" trim={true}>
                  {TOOL_TITLE}
                </Text>
                {SCHEDULE_STATES.map((state) => (
                  <Text key={state} size={1} muted as="div" trim={true}>
                    {SCHEDULE_STATE_DICTIONARY[state].title}
                  </Text>
                ))}
              </Flex>
            </Section>

            <Section title="calendar">
              <Flex gap={4} flexWrap="wrap">
                <Card border radius={2}>
                  <Calendar
                    focusedDate={FOCUSED}
                    onFocusedDateChange={noop}
                    onSelect={noop}
                    selectedDate={SELECTED}
                    timeZoneScope={SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE}
                  />
                </Card>
                <Card border radius={2}>
                  <Calendar
                    focusedDate={FOCUSED}
                    onFocusedDateChange={noop}
                    onSelect={noop}
                    selectTime
                    selectedDate={SELECTED}
                    timeStep={15}
                    timeZoneScope={SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE}
                  />
                </Card>
              </Flex>
            </Section>

            <Section title="calendar days">
              <Flex gap={1}>
                <CalendarDay
                  date={SELECTED}
                  isToday={false}
                  onSelect={noop}
                  selected
                  isCurrentMonth
                />
                <CalendarDay
                  date={FOCUSED}
                  focused
                  isToday={false}
                  onSelect={noop}
                  isCurrentMonth
                />
                <CalendarDay date={WEEKEND} isToday onSelect={noop} isCurrentMonth />
                <CalendarDay date={WEEKEND} isToday={false} onSelect={noop} />
                <CalendarDay
                  customValidation={() => false}
                  date={FOCUSED}
                  isToday={false}
                  onSelect={noop}
                  isCurrentMonth
                />
              </Flex>
            </Section>

            <Section title="tool calendar days and pips">
              <SchedulesProvider value={{schedules: SCHEDULES, scheduleState: 'scheduled'}}>
                <Flex gap={1}>
                  <ToolCalendarDay date={SELECTED} isToday={false} onSelect={noop} isCurrentMonth />
                  <ToolCalendarDay date={SELECTED} isToday={false} onSelect={noop} selected />
                  <ToolCalendarDay date={FOCUSED} focused isToday={false} onSelect={noop} />
                  <ToolCalendarDay date={WEEKEND} isToday onSelect={noop} />
                </Flex>
              </SchedulesProvider>
              <Flex gap={2} style={{width: 120}}>
                <Pip />
                <Pip selected />
                <Pip mode="failed" />
              </Flex>
            </Section>

            <Section title="datetime inputs">
              <DateTimeInput
                onChange={noop}
                placeholder="Pick a date"
                timeZoneScope={SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE}
                value={SELECTED}
              />
              <DateTimeInput
                customValidity="Date cannot be in the past."
                inputValue="2024-01-15 10:00"
                onChange={noop}
                selectTime
                timeZoneScope={SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE}
                value={SELECTED}
              />
              <DateTimeInput
                onChange={noop}
                placeholder="Read only"
                readOnly
                timeZoneScope={SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE}
              />
              <CommonDateTimeInput
                deserialize={parseInputValue}
                formatInputValue={formatInputValue}
                level={0}
                markers={[]}
                onChange={noop}
                parseInputValue={parseInputValue}
                placeholder="Common date input"
                readOnly={false}
                selectTime
                serialize={serialize}
                timeZoneScope={SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE}
                title="Common date and time"
                description="Shared field chrome around the base input"
                value={SELECTED_ISO}
              />
              <ScheduleDateTimeInput
                level={0}
                markers={[]}
                onChange={noop}
                timeZoneScope={SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE}
                type={{
                  name: 'date',
                  title: 'Publish date',
                  description: 'Schema-driven datetime input',
                  placeholder: 'Schema date input',
                  options: {timeStep: 15},
                }}
                value={SELECTED_ISO}
              />
            </Section>

            <Section title="schedule form">
              <ScheduleForm value={{date: SELECTED_ISO}} />
            </Section>

            <Section title="context menu item with permissions tooltip">
              <Card border radius={2} style={{width: 240}}>
                <Menu>
                  <MenuItemWithPermissionsTooltip
                    hasPermission
                    icon={null}
                    onClick={noop}
                    permissionsOperationLabel="execute-schedules"
                    title="Publish now"
                  />
                  <MenuItemWithPermissionsTooltip
                    hasPermission={false}
                    icon={null}
                    onClick={noop}
                    permissionsOperationLabel="delete-schedules"
                    title="Delete schedule"
                    tone="critical"
                  />
                </Menu>
              </Card>
            </Section>

            <Section title="empty schedules panel">
              <Card border radius={2} style={{height: 320}}>
                <SchedulesProvider value={{schedules: [], scheduleState: 'succeeded'}}>
                  <Schedules />
                </SchedulesProvider>
              </Card>
            </Section>
          </VStack>
        </Card>
      </LocaleProvider>
    </TestWrapper>
  )
}
