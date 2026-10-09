import {Card, Text} from '@sanity/ui'
import {useState} from 'react'
import {VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE} from '../../../../../constants'
import {Calendar} from '../Calendar'
import {CalendarDay} from '../CalendarDay'
import {CalendarMonth} from '../CalendarMonth'

// Fixed dates: a month in the past keeps "today" out of the rendered grid, so the
// snapshot does not change with the day the suite runs on.
const SELECTED_DATE = new Date(2024, 0, 15, 10, 30)
const MONTH_START = new Date(2024, 0, 1)

const isOnOrAfterSelected = (date: Date) => date >= SELECTED_DATE

function noop() {
  return undefined
}

function CalendarHarness() {
  const [selectedDate, setSelectedDate] = useState(SELECTED_DATE)
  const [focusedDate, setFocusedDate] = useState(SELECTED_DATE)

  return (
    <TestWrapper schemaTypes={[]}>
      <Card border radius={2} style={{width: 'fit-content'}}>
        <Calendar
          data-testid="calendar"
          focusedDate={focusedDate}
          onFocusedDateChange={setFocusedDate}
          onSelect={setSelectedDate}
          selectTime
          selectedDate={selectedDate}
          timeZoneScope={SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE}
        />
      </Card>
    </TestWrapper>
  )
}

function CalendarMonthHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <VStack gap={5}>
        <VStack gap={3}>
          <Text muted size={1} weight="medium">
            Month with past days disabled
          </Text>
          <CalendarMonth
            customValidation={isOnOrAfterSelected}
            date={MONTH_START}
            focused={SELECTED_DATE}
            onSelect={noop}
            selected={SELECTED_DATE}
            timeZoneScope={SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE}
          />
        </VStack>
        <VStack gap={3}>
          <Text muted size={1} weight="medium">
            Day states
          </Text>
          <div
            data-testid="day-states"
            style={{display: 'grid', gap: 4, gridTemplateColumns: 'repeat(5, 46px)'}}
          >
            <CalendarDay
              date={new Date(2024, 0, 2)}
              isCurrentMonth
              isToday={false}
              onSelect={noop}
            />
            <CalendarDay date={new Date(2024, 0, 3)} isCurrentMonth isToday onSelect={noop} />
            <CalendarDay
              date={new Date(2024, 0, 4)}
              isCurrentMonth
              isToday={false}
              onSelect={noop}
              selected
            />
            <CalendarDay
              date={new Date(2024, 0, 5)}
              focused
              isCurrentMonth
              isToday={false}
              onSelect={noop}
            />
            <CalendarDay
              date={new Date(2023, 11, 31)}
              isCurrentMonth={false}
              isToday={false}
              onSelect={noop}
            />
          </div>
        </VStack>
      </VStack>
    </TestWrapper>
  )
}

describe('scheduled publishing Calendar', () => {
  test('selects a day in the focused month and keeps the time', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<CalendarHarness />)

    const calendar = page.getByTestId('calendar')
    await expect
      .element(calendar.getByRole('button', {name: 'Mon Jan 15 2024'}))
      .toHaveAttribute('aria-pressed', 'true')

    await calendar.getByRole('button', {name: 'Mon Jan 22 2024'}).click()

    await expect
      .element(calendar.getByRole('button', {name: 'Mon Jan 22 2024'}))
      .toHaveAttribute('aria-pressed', 'true')
    await expect
      .element(calendar.getByRole('button', {name: 'Mon Jan 15 2024'}))
      .toHaveAttribute('aria-pressed', 'false')
    await expect.element(calendar.getByLabelText('Select hour')).toHaveValue('10')
    await expect.element(calendar.getByLabelText('Select minutes')).toHaveValue('30')

    await settleChromaticEndState()
  })

  test('moves to the next month from the header', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<CalendarHarness />)

    const calendar = page.getByTestId('calendar')
    await calendar.getByRole('button', {name: 'Go to next month'}).click()

    await expect.element(calendar.getByRole('button', {name: 'Thu Feb 01 2024'})).toBeVisible()
    await expect
      .element(calendar.getByRole('button', {name: 'Mon Jan 15 2024'}))
      .not.toBeInTheDocument()

    await settleChromaticEndState()
  })

  test('disables days rejected by custom validation and renders day states', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<CalendarMonthHarness />)

    await expect.element(page.getByRole('button', {name: 'Sun Jan 14 2024'})).toBeDisabled()
    await expect.element(page.getByRole('button', {name: 'Mon Jan 15 2024'})).toBeEnabled()
    await expect
      .element(page.getByRole('button', {name: 'Mon Jan 15 2024'}))
      .toHaveAttribute('aria-pressed', 'true')

    const dayStates = page.getByTestId('day-states')
    await expect
      .element(dayStates.getByRole('button', {name: 'Thu Jan 04 2024'}))
      .toHaveAttribute('aria-pressed', 'true')
    await expect
      .element(dayStates.getByRole('button', {name: 'Fri Jan 05 2024'}))
      .toHaveAttribute('data-focused', 'true')

    await settleChromaticEndState()
  })
})
