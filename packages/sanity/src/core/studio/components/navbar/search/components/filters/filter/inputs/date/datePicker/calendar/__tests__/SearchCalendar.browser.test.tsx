import {Card} from '@sanity/ui'
import {CalendarContext} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {
  expectStable,
  testHelpers,
} from '../../../../../../../../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../../../../../../../../test/browser/TestWrapper'
import {LocaleProvider} from '../../../../../../../../../../../../i18n/components/LocaleProvider'
import {CalendarDay} from '../CalendarDay'
import {CalendarHeader} from '../CalendarHeader'
import {CalendarMonth} from '../CalendarMonth'
import {type CalendarContextValue} from '../contexts/CalendarContext'

const NOOP = () => undefined

// Local noon so the formatted month and the "today" ring stay on 15 March in
// any timezone the runner uses. `CalendarDay` marks today with `new Date()`.
const FIXED_NOW = new Date(2026, 2, 15, 12, 0, 0)
const RANGE_START = new Date(2026, 2, 10, 12, 0, 0)
const RANGE_END = new Date(2026, 2, 18, 12, 0, 0)

const CALENDAR_CONTEXT = {
  date: RANGE_START,
  endDate: RANGE_END,
  firstWeekDay: 7,
  focusedDate: FIXED_NOW,
  selectRange: true,
} satisfies CalendarContextValue

// `vi.useFakeTimers` stalls the mock workspace promise, so the calendar never
// mounts. A constructor that only freezes `new Date()` keeps the today ring
// stable without touching timers.
const RealDate = globalThis.Date

beforeEach(() => {
  const fixed = FIXED_NOW.getTime()

  function FixedDate(...args: unknown[]): Date {
    if (args.length === 0) return new RealDate(fixed)
    return Reflect.construct(RealDate, args)
  }
  FixedDate.prototype = RealDate.prototype
  FixedDate.now = () => fixed
  FixedDate.parse = RealDate.parse
  FixedDate.UTC = RealDate.UTC

  vi.stubGlobal('Date', FixedDate)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/**
 * Chromatic sentinel for the search date-picker calendar: weekday labels,
 * the month title, and day cells (today ring, range start/end, in-range,
 * outside-month). Dates are fixed; nothing is queried.
 */
function SearchCalendarHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <LocaleProvider>
        <Card padding={3} style={{width: 360}}>
          <CalendarContext.Provider value={CALENDAR_CONTEXT}>
            <CalendarHeader moveFocusedDate={NOOP} onNowClick={NOOP} />
            <CalendarMonth onSelect={NOOP} />
            {/* Direct render so coverage counts CalendarDay. The month already paints the cells. */}
            <div hidden>
              <CalendarDay date={RANGE_START} onSelect={NOOP} />
            </div>
          </CalendarContext.Provider>
        </Card>
      </LocaleProvider>
    </TestWrapper>
  )
}

describe('search calendar', () => {
  it('renders March 2026 with a fixed today and a selected range', async () => {
    const {settleChromaticEndState} = testHelpers()
    await render(<SearchCalendarHarness />)

    await expect.element(page.getByText('March 2026', {exact: true})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Go to today', exact: true})).toBeVisible()
    await expect.element(page.getByText('Sun', {exact: true})).toBeVisible()

    const today = page.getByRole('button', {name: 'Sun Mar 15 2026', exact: true})
    await expect.element(today).toBeVisible()
    expect(today.element().querySelector('circle')).not.toBeNull()

    const start = document.querySelector('[data-start-date="true"]')
    const end = document.querySelector('[data-end-date="true"]')
    expect(start?.textContent).toBe('10')
    expect(end?.textContent).toBe('18')
    expect(document.querySelectorAll('[data-within-range="true"]').length).toBeGreaterThan(0)

    await expectStable(() => today.element().getBoundingClientRect().width)
    await settleChromaticEndState()
  })
})
