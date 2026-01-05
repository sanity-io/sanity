import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {of} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {useKeyValueStore} from '../../../../../store/_legacy/datastores'
import {Calendar} from '../Calendar'
import {type CalendarLabels} from '../types'

vi.mock('../../../../../store/_legacy/datastores', () => ({
  useKeyValueStore: vi.fn(),
}))
const useKeyValueStoreMock = useKeyValueStore as Mock

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
  setToTimePreset: (time: string, _date: Date) => `Set to ${time}`,
}

const defaultProps = {
  value: new Date('2024-01-15T10:00:00Z'),
  onSelect: vi.fn(),
  labels: mockLabels,
  timeZoneScope: {type: 'input', id: 'test'},
}

describe('Calendar with no stored timezone', () => {
  beforeEach(() => {
    // Setup default mock for keyValueStore - returns null (no stored timezone)
    const getKeyMock = vi.fn().mockReturnValue(of(null))
    const setKeyMock = vi.fn().mockResolvedValue(null)
    useKeyValueStoreMock.mockReturnValue({getKey: getKeyMock, setKey: setKeyMock})
  })

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
    const TestProvider = await createTestProvider()
    const mockOnSelect = vi.fn()

    render(
      <TestProvider>
        <Calendar
          {...defaultProps}
          onSelect={mockOnSelect}
          value={new Date('2024-01-15T14:30:00Z')}
          timeZoneScope={{type: 'input', id: 'test'}}
        />
      </TestProvider>,
    )

    // Find and click a date January 20, 2024
    const dateButton = screen.getByTestId('calendar-day-Sat-Jan-20-2024')
    await userEvent.click(dateButton)

    expect(mockOnSelect).toHaveBeenCalledTimes(1)
    expect(mockOnSelect).toHaveBeenCalledWith(new Date('2024-01-20T14:30:00Z'))
  })
})
describe('Calendar with stored timezone tokyo', () => {
  beforeEach(() => {
    // Setup default mock for keyValueStore - returns null (no stored timezone)
    const getKeyMock = vi.fn().mockReturnValue(of('Asia/Tokyo'))
    const setKeyMock = vi.fn().mockResolvedValue(null)
    useKeyValueStoreMock.mockReturnValue({getKey: getKeyMock, setKey: setKeyMock})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('calls onSelect with timezone-adjusted date should have the time in UTC', async () => {
    const TestProvider = await createTestProvider()
    const mockOnSelect = vi.fn()
    // 14:30 in UTC is 23:30 in tokyo
    const date = new Date('2024-01-15T14:30:00Z')
    render(
      <TestProvider>
        <Calendar
          {...defaultProps}
          selectTime
          onSelect={mockOnSelect}
          value={date}
          timeZoneScope={{type: 'input', id: 'test'}}
        />
      </TestProvider>,
    )

    // find the time input and check if the value is 23:30
    const timeInput = screen.getByLabelText('Select time')
    expect(timeInput).toHaveValue('23:30')
    // Find and click a date January 20, 2024
    const dateButton = screen.getByTestId('calendar-day-Sat-Jan-20-2024')
    await userEvent.click(dateButton)
    // Verify onSelect was called with timezone-adjusted date
    expect(mockOnSelect).toHaveBeenCalledTimes(1)
    expect(mockOnSelect).toHaveBeenCalledWith(new Date('2024-01-20T14:30:00Z'))
  })
  it('calls onSelect when doing a time input change', async () => {
    const TestProvider = await createTestProvider()
    const mockOnSelect = vi.fn()
    // 14:30 in UTC is 23:30 in Tokyo
    const date = new Date('2024-01-15T14:30:00Z')
    render(
      <TestProvider>
        <Calendar
          {...defaultProps}
          selectTime
          onSelect={mockOnSelect}
          value={date}
          timeZoneScope={{type: 'input', id: 'test'}}
        />
      </TestProvider>,
    )

    // find the time input and check if the value is 23:30 which is the tokyo time for 14:30 UTC
    const timeInput = screen.getByLabelText('Select time')
    // check the time input value is 23:30
    expect(timeInput).toHaveValue('23:30')

    // Change the time to 22:30 Tokyo time
    await userEvent.clear(timeInput)
    await userEvent.type(timeInput, '22:30')

    // 22:30 Tokyo = 13:30 UTC (Tokyo is UTC+9)
    expect(mockOnSelect).toHaveBeenCalledWith(new Date('2024-01-15T13:30:00Z'))
  })
  it('calls onSelect with timezone-adjusted date, display is the following day', async () => {
    const TestProvider = await createTestProvider()
    const mockOnSelect = vi.fn()
    // 14:30 in UTC is 23:30 in tokyo
    const date = new Date('2024-01-15T18:30:00Z')
    render(
      <TestProvider>
        <Calendar
          {...defaultProps}
          selectTime
          onSelect={mockOnSelect}
          value={date}
          timeZoneScope={{type: 'input', id: 'test'}}
        />
      </TestProvider>,
    )

    // find the time input and check if the value is 03:30 next day
    const timeInput = screen.getByLabelText('Select time')
    expect(timeInput).toHaveValue('03:30')
    // Find and click a date January 20, 2024
    const dateButton = screen.getByTestId('calendar-day-Sat-Jan-20-2024')
    await userEvent.click(dateButton)
    // Verify onSelect was called with timezone-adjusted date
    expect(mockOnSelect).toHaveBeenCalledTimes(1)
    // We have selected the 20th at 03:30, but in tokyo time, which is one day ahead of UTC, so the date should be the 19th at 18:30
    expect(mockOnSelect).toHaveBeenCalledWith(new Date('2024-01-19T18:30:00Z'))
  })
})
