import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getByDataUi, queryByDataUi} from '../../../../../../test/setup/customQueries'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useTimeZoneMockReturn} from '../../../../scheduledPublishing/hooks/__tests__/__mocks__/useTimeZone.mock'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {
  mockUseReleaseOperations,
  useReleaseOperationsMockReturn,
} from '../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {ReleaseTypePicker} from '../ReleaseTypePicker'

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../hooks/useTimeZone', async (importOriginal) => ({
  ...(await importOriginal()),
  useTimeZone: vi.fn(() => useTimeZoneMockReturn),
}))

const renderComponent = async (release = activeASAPRelease) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })

  render(<ReleaseTypePicker release={release} />, {wrapper})

  await waitFor(() => {
    expect(screen.getByTestId('release-type-label')).toBeInTheDocument()
  })
}

const mockUpdateRelease = vi.fn()

describe('ReleaseTypePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseReleaseOperations.mockReturnValue({
      ...useReleaseOperationsMockReturn,
      updateRelease: mockUpdateRelease.mockResolvedValue({}),
    })
  })

  describe('renders the label for different release types', () => {
    it('renders the button and displays for ASAP release', async () => {
      await renderComponent()

      expect(screen.getByText('ASAP')).toBeInTheDocument()
    })

    it('renders the button and displays for undecided release', async () => {
      await renderComponent(activeUndecidedRelease)

      expect(screen.getByText('Undecided')).toBeInTheDocument()
    })

    it('renders the button and displays the date for scheduled release', async () => {
      await renderComponent(activeScheduledRelease)

      expect(screen.getByText('Oct 10, 2023', {exact: false})).toBeInTheDocument()
    })

    it('renders the label with a published text when release was asap published', async () => {
      await renderComponent(publishedASAPRelease)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()

      expect(screen.getByTestId('published-release-type-label')).toBeInTheDocument()

      expect(screen.getByText('Published on Oct 10, 2023, 3:00:00 AM')).toBeInTheDocument()
    })

    it('renders the label with a published text when release was schedule published', async () => {
      await renderComponent({...scheduledRelease, state: 'published'})

      expect(screen.queryByRole('button')).not.toBeInTheDocument()

      expect(screen.getByTestId('published-release-type-label')).toBeInTheDocument()

      expect(screen.getByText('Published on Oct 10, 2023, 3:00:00 AM')).toBeInTheDocument()
    })
  })

  describe('interacting with the popup content', () => {
    it('opens the popover when the button is clicked', async () => {
      await renderComponent()

      const pickerButton = screen.getByRole('button')
      fireEvent.click(pickerButton)
      getByDataUi(document.body, 'Popover')
    })

    it('does not show calendar for ASAP and undecided releases', async () => {
      await renderComponent()

      const pickerButton = screen.getByRole('button')
      fireEvent.click(pickerButton)
      expect(screen.queryByTestId('date-input')).not.toBeInTheDocument()
      expect(queryByDataUi(document.body, 'Calendar')).not.toBeInTheDocument()

      const scheduledTab = screen.getByText('Undecided')
      fireEvent.click(scheduledTab)
      expect(screen.queryByTestId('date-input')).not.toBeInTheDocument()
      expect(queryByDataUi(document.body, 'Calendar')).not.toBeInTheDocument()
    })

    it('switches to "Scheduled" release type and displays the date input', async () => {
      await renderComponent()

      const pickerButton = screen.getByRole('button')
      fireEvent.click(pickerButton)
      const scheduledTab = screen.getByText('At time')
      fireEvent.click(scheduledTab)
      expect(screen.getByTestId('date-input')).toBeInTheDocument()
      expect(getByDataUi(document.body, 'Calendar')).toBeInTheDocument()
    })

    it('hides calendar when moving back from scheduled option', async () => {
      await renderComponent()

      const pickerButton = screen.getByRole('button')
      fireEvent.click(pickerButton)
      const scheduledTab = within(screen.getByRole('tablist')).getByText('At time')
      fireEvent.click(scheduledTab)
      const asapTab = within(screen.getByRole('tablist')).getByText('ASAP')
      fireEvent.click(asapTab)

      expect(screen.queryByTestId('date-input')).not.toBeInTheDocument()
      expect(queryByDataUi(document.body, 'Calendar')).not.toBeInTheDocument()
    })

    it('sets the selected scheduled time when popup closed', async () => {
      await renderComponent()

      const pickerButton = screen.getByRole('button')
      fireEvent.click(pickerButton)
      const scheduledTab = screen.getByText('At time')
      fireEvent.click(scheduledTab)

      const Calendar = getByDataUi(document.body, 'Calendar')
      const CalendarMonth = getByDataUi(document.body, 'CalendarMonth')

      // Select the 10th day in the calendar month
      fireEvent.click(within(Calendar).getByTestId('calendar-next-month'))
      fireEvent.click(within(CalendarMonth).getByText('10'))
      fireEvent.change(screen.getByLabelText('Select hour'), {target: {value: 10}})
      fireEvent.change(screen.getByLabelText('Select minute'), {target: {value: 55}})
      expect(mockUpdateRelease).not.toHaveBeenCalled()

      // Close the popup and check if the release is updated
      fireEvent.click(screen.getByTestId('release-type-picker'))
      expect(mockUpdateRelease).toHaveBeenCalledTimes(1)
      expect(mockUpdateRelease).toHaveBeenCalledWith({
        ...activeASAPRelease,
        metadata: expect.objectContaining({
          ...activeASAPRelease.metadata,
          releaseType: 'scheduled',
          /**  @todo improve the assertion on the dateTime */
          intendedPublishAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:55:\d{2}\.\d{3}Z$/),
        }),
      })
    })

    it('sets the release type to undecided when undecided is selected', async () => {
      await renderComponent()

      const pickerButton = screen.getByRole('button')
      fireEvent.click(pickerButton)
      const undecidedTab = screen.getByText('Undecided')
      fireEvent.click(undecidedTab)
      fireEvent.click(screen.getByTestId('release-type-picker'))
      expect(mockUpdateRelease).toHaveBeenCalledTimes(1)
      expect(mockUpdateRelease).toHaveBeenCalledWith({
        ...activeASAPRelease,
        metadata: expect.objectContaining({
          ...activeASAPRelease.metadata,
          intendedPublishAt: undefined,
          releaseType: 'undecided',
        }),
      })
    })
  })

  describe('picker behavior based on release state', () => {
    it('does not show button for picker when release is published state', async () => {
      await renderComponent(publishedASAPRelease)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('shows a spinner when updating the release', async () => {
      // keep promise pending
      mockUseReleaseOperations.mockReturnValue({
        ...useReleaseOperationsMockReturn,
        updateRelease: vi.fn().mockImplementation(() => {
          return new Promise(() => {})
        }),
      })
      await renderComponent()

      const pickerButton = screen.getByRole('button')
      fireEvent.click(pickerButton)
      fireEvent.click(screen.getByText('Undecided'))
      fireEvent.click(screen.getByTestId('release-type-picker'))

      await waitFor(() => {
        // Check if the spinner is displayed while updating
        screen.queryByTestId('updating-release-spinner')
      })
    })
  })
})
