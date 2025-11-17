import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {
  mockUseTimeZoneDefault,
  mockUseTimeZoneWithTokyo,
} from '../../../../../form/inputs/DateInputs/__tests__/__mocks__/timezoneMocks'
import {type TimeZoneScope} from '../../../../../hooks/useTimeZone'
import * as useTimeZoneModule from '../../../../../hooks/useTimeZone'
import {Calendar} from '../Calendar'
import {type CalendarLabels} from '../types'

vi.mock('../../../../../hooks/useTimeZone', () => ({
  useTimeZone: () => mockUseTimeZoneDefault(),
}))

const mockLabels: CalendarLabels = {
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
  weekDayNamesShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  setToTimePreset: (time: string, date: Date) => `Set to ${time}`,
}

const defaultProps = {
  selectedDate: new Date('2024-01-15T10:00:00Z'),
  focusedDate: new Date('2024-01-15T10:00:00Z'),
  onSelect: vi.fn(),
  onFocusedDateChange: vi.fn(),
  labels: mockLabels,
  timeZoneScope: {type: 'input', id: 'test'} as TimeZoneScope,
}

describe('Calendar', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders without crashing', async () => {
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <Calendar {...defaultProps} timeZoneScope={{type: 'input', id: 'test'}} />
      </TestProvider>,
    )

    // Check that the calendar container with data-ui="Calendar" is rendered
    expect(screen.getByTestId('calendar')).toBeInTheDocument()
  })

  it('calls onSelect with new date when clicking a date', async () => {
    const spy = vi.spyOn(useTimeZoneModule, 'useTimeZone').mockReturnValue({
      ...mockUseTimeZoneDefault(),
      timeZone: undefined,
    })
    const TestProvider = await createTestProvider()
    const mockOnSelect = vi.fn()

    render(
      <TestProvider>
        <Calendar
          {...defaultProps}
          onSelect={mockOnSelect}
          selectedDate={new Date('2024-01-15T14:30:00Z')}
          timeZoneScope={{type: 'input', id: 'test'}}
        />
      </TestProvider>,
    )

    // Find and click a date January 20, 2024
    const dateButton = screen.getByTestId('calendar-day-Sat-Jan-20-2024')
    await userEvent.click(dateButton)

    expect(mockOnSelect).toHaveBeenCalledTimes(1)
    expect(mockOnSelect).toHaveBeenCalledWith(new Date('2024-01-20T14:30:00Z'))
    spy.mockRestore()
  })

  describe('handleDateChange', () => {
    it('calls onSelect with timezone-adjusted date should have the time in UTC', async () => {
      const spy = vi
        .spyOn(useTimeZoneModule, 'useTimeZone')
        .mockReturnValue(mockUseTimeZoneWithTokyo)

      const TestProvider = await createTestProvider()
      const mockOnSelect = vi.fn()

      render(
        <TestProvider>
          <Calendar
            {...defaultProps}
            onSelect={mockOnSelect}
            selectedDate={new Date('2024-01-15T14:30:00Z')}
            timeZoneScope={{type: 'input', id: 'test'}}
          />
        </TestProvider>,
      )

      // Now change the timezone to Tokyo
      vi.spyOn(useTimeZoneModule, 'useTimeZone').mockReturnValue(mockUseTimeZoneWithTokyo)

      // Find and click a date January 20, 2024
      const dateButton = screen.getByTestId('calendar-day-Sat-Jan-20-2024')
      await userEvent.click(dateButton)

      // Verify onSelect was called with timezone-adjusted date
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
      expect(mockOnSelect).toHaveBeenCalledWith(new Date('2024-01-19T21:30:00Z'))

      spy.mockRestore()
    })
  })
})
