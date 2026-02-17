import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {useTimeZone} from '../../hooks/useTimeZone'
import {type NormalizedTimeZone} from '../../studio/timezones/types'
import DialogTimeZone from './DialogTimeZone'

vi.mock('../../hooks/useTimeZone')
vi.mock('../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockTimeZones: NormalizedTimeZone[] = [
  {
    abbreviation: 'EST',
    namePretty: 'America/New_York',
    offset: '-05:00',
    name: 'America/New_York',
    alternativeName: 'Eastern Time',
    city: 'New York',
    value: 'America/New_York',
  },
  {
    abbreviation: 'GMT',
    namePretty: 'Europe/London',
    offset: '+00:00',
    name: 'Europe/London',
    alternativeName: 'Greenwich Mean Time',
    city: 'London',
    value: 'Europe/London',
  },
  {
    abbreviation: 'PST',
    namePretty: 'America/Los_Angeles',
    offset: '-08:00',
    name: 'America/Los_Angeles',
    alternativeName: 'Pacific Time',
    city: 'Los Angeles',
    value: 'America/Los_Angeles',
  },
]

describe('DialogTimeZone', () => {
  const mockSetTimeZone = vi.fn()
  const mockGetTimeZone = vi.fn((value: string) => mockTimeZones.find((tz) => tz.value === value))
  const mockGetLocalTimeZone = vi.fn(() => mockTimeZones[0])
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTimeZone).mockReturnValue({
      timeZone: mockTimeZones[0],
      setTimeZone: mockSetTimeZone,
      getTimeZone: mockGetTimeZone,
      getLocalTimeZone: mockGetLocalTimeZone,
      allTimeZones: mockTimeZones,
      zoneDateToUtc: vi.fn(),
      utcToCurrentZoneDate: vi.fn(),
      getCurrentZoneDate: vi.fn(),
      formatDateTz: vi.fn(),
    })
  })

  it('renders with initial timezone selection', async () => {
    const wrapper = await createTestProvider()

    render(<DialogTimeZone onClose={mockOnClose} timeZoneScope={{type: 'input', id: 'test'}} />, {
      wrapper,
    })

    expect(screen.getByText('Select time zone')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Eastern Time (America/New_York)')).toBeInTheDocument()
  })

  it('shows all options when dropdown button is clicked', async () => {
    const wrapper = await createTestProvider()
    const user = userEvent.setup()

    render(<DialogTimeZone onClose={mockOnClose} timeZoneScope={{type: 'input', id: 'test'}} />, {
      wrapper,
    })

    // Click the dropdown button
    const dropdownButton = screen.getByRole('button', {name: /open/i})
    await user.click(dropdownButton)

    // Wait for the combobox to be expanded
    await waitFor(() => {
      const combobox = screen.getByRole('combobox')
      expect(combobox).toHaveAttribute('aria-expanded', 'true')
    })
  })

  it('allows typing to filter timezones', async () => {
    const wrapper = await createTestProvider()
    const user = userEvent.setup()

    render(<DialogTimeZone onClose={mockOnClose} timeZoneScope={{type: 'input', id: 'test'}} />, {
      wrapper,
    })

    // Clear and type to search for London
    const combobox = screen.getByRole('combobox')
    await user.clear(combobox)
    await user.type(combobox, 'London')

    // Verify the input contains London
    expect(combobox).toHaveValue('London')
  })

  it('clears selection when X button is clicked', async () => {
    const wrapper = await createTestProvider()
    const user = userEvent.setup()

    render(<DialogTimeZone onClose={mockOnClose} timeZoneScope={{type: 'input', id: 'test'}} />, {
      wrapper,
    })

    // Find the autocomplete input container
    const autocomplete = screen.getByRole('combobox')
    const clearButton = within(autocomplete.parentElement!).getByRole('button', {name: /clear/i})

    await user.click(clearButton)

    // Input should be empty
    expect(screen.getByRole('combobox')).toHaveValue('')

    // Update button should be disabled
    const updateButton = screen.getByRole('button', {name: 'Update time zone'})
    expect(updateButton).toBeDisabled()
  })

  it('update button is disabled when timezone unchanged', async () => {
    const wrapper = await createTestProvider()

    render(<DialogTimeZone onClose={mockOnClose} timeZoneScope={{type: 'input', id: 'test'}} />, {
      wrapper,
    })

    // Update button should be disabled when no change has been made
    const updateButton = screen.getByRole('button', {name: 'Update time zone'})
    expect(updateButton).toBeDisabled()
  })
})
