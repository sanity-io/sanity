import {Menu} from '@sanity/ui'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

// Now we can safely import the hook and other dependencies
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {MenuItem} from '../../../ui-components'
import {scheduledRelease} from '../../releases/__fixtures__/release.fixture'
import {DeleteScheduledDraftDialog} from '../components/DeleteScheduledDraftDialog'
import {PublishScheduledDraftDialog} from '../components/PublishScheduledDraftDialog'
import {ScheduleDraftDialog} from '../components/ScheduleDraftDialog'
import {
  useScheduledDraftMenuActions,
  type UseScheduledDraftMenuActionsOptions,
} from './useScheduledDraftMenuActions'
import {useScheduleDraftOperations} from './useScheduleDraftOperations'

// Mock the dialog components BEFORE importing the hook to prevent dependency issues
vi.mock('../components/PublishScheduledDraftDialog', () => ({
  PublishScheduledDraftDialog: vi.fn(),
}))

vi.mock('../components/ScheduleDraftDialog', () => ({
  ScheduleDraftDialog: vi.fn(),
}))

vi.mock('../components/DeleteScheduledDraftDialog', () => ({
  DeleteScheduledDraftDialog: vi.fn(),
}))

vi.mock('./useScheduleDraftOperations', () => ({
  useScheduleDraftOperations: vi.fn(),
}))

vi.mock('./useScheduledDraftDocument', () => ({
  useScheduledDraftDocument: () => ({
    firstDocument: null,
  }),
}))

// Mock operations that will be used by the hook
const mockOperations = {
  publishScheduledDraft: vi.fn(),
  rescheduleScheduledDraft: vi.fn(),
  deleteScheduledDraft: vi.fn(),
  createScheduledDraft: vi.fn(),
}

// Mock toast push function
const mockToastPush = vi.fn()

vi.mock('@sanity/ui', async () => {
  const actual = await vi.importActual('@sanity/ui')
  return {
    ...actual,
    useToast: () => ({
      push: mockToastPush,
    }),
  }
})

// Type the mocked functions properly
const mockUseScheduleDraftOperations = useScheduleDraftOperations as MockedFunction<
  typeof useScheduleDraftOperations
>
const mockPublishScheduledDraftDialog = PublishScheduledDraftDialog as MockedFunction<
  typeof PublishScheduledDraftDialog
>
const mockScheduleDraftDialog = ScheduleDraftDialog as MockedFunction<typeof ScheduleDraftDialog>
const mockDeleteScheduledDraftDialog = DeleteScheduledDraftDialog as MockedFunction<
  typeof DeleteScheduledDraftDialog
>

// Test component that renders the hook's output
interface TestComponentProps {
  options: UseScheduledDraftMenuActionsOptions
}

function TestComponent({options}: TestComponentProps) {
  const {actions, dialogs} = useScheduledDraftMenuActions(options)

  return (
    <>
      <Menu>
        <div data-testid="menu-items">
          <MenuItem {...actions.publishNow} />
          <MenuItem {...actions.editSchedule} />
          <MenuItem {...actions.deleteSchedule} />
        </div>
      </Menu>
      <div data-testid="menu-item-props">
        <div data-testid="publish-now-props">
          <span data-testid="publish-now-text">{actions.publishNow.text}</span>
          <span data-testid="publish-now-disabled">{String(actions.publishNow.disabled)}</span>
        </div>
        <div data-testid="edit-schedule-props">
          <span data-testid="edit-schedule-text">{actions.editSchedule.text}</span>
          <span data-testid="edit-schedule-disabled">{String(actions.editSchedule.disabled)}</span>
        </div>
        <div data-testid="delete-schedule-props">
          <span data-testid="delete-schedule-text">{actions.deleteSchedule.text}</span>
          <span data-testid="delete-schedule-disabled">
            {String(actions.deleteSchedule.disabled)}
          </span>
        </div>
      </div>
      <div data-testid="dialogs">{dialogs}</div>
    </>
  )
}

describe('useScheduledDraftMenuActions', () => {
  let TestProvider: React.ComponentType<{children: React.ReactNode}>

  beforeEach(async () => {
    vi.clearAllMocks()

    // Setup mock implementations
    mockUseScheduleDraftOperations.mockReturnValue(mockOperations)

    // Setup dialog mock implementations
    mockPublishScheduledDraftDialog.mockImplementation(({onClose, release}) => {
      const handlePublish = async () => {
        try {
          await mockOperations.publishScheduledDraft(release)
          onClose()
        } catch (error) {
          mockToastPush({
            closable: true,
            status: 'error',
            description: expect.any(Object),
          })
          onClose()
        }
      }

      return (
        <div data-testid="publish-scheduled-draft-dialog">
          <button type="button" onClick={handlePublish} data-testid="confirm-publish">
            Publish Now
          </button>
        </div>
      )
    })

    mockScheduleDraftDialog.mockImplementation(({onClose, onSchedule}) => (
      <div data-testid="schedule-draft-dialog">
        <button
          type="button"
          onClick={() => onSchedule(new Date('2024-12-31T10:00:00Z'))}
          data-testid="confirm-reschedule"
        >
          Reschedule
        </button>
      </div>
    ))

    mockDeleteScheduledDraftDialog.mockImplementation(({onClose, release}) => {
      const handleDelete = async () => {
        await mockOperations.deleteScheduledDraft(release)
        onClose()
      }

      return (
        <div data-testid="delete-scheduled-draft-dialog">
          <button type="button" onClick={handleDelete} data-testid="confirm-delete">
            Delete Schedule
          </button>
        </div>
      )
    })

    mockOperations.publishScheduledDraft.mockResolvedValue(undefined)
    mockOperations.rescheduleScheduledDraft.mockResolvedValue(undefined)
    mockOperations.deleteScheduledDraft.mockResolvedValue(undefined)

    TestProvider = await createTestProvider()
  })

  it('should render all three menu items in the correct order', () => {
    render(
      <TestProvider>
        <TestComponent options={{release: scheduledRelease}} />
      </TestProvider>,
    )

    const menuContainer = screen.getByTestId('menu-items')
    const menuItems = menuContainer.children

    // Should have exactly 3 menu items
    expect(menuItems).toHaveLength(3)

    // Check the order: Publish Now -> Edit Schedule -> Delete Schedule
    expect(menuItems[0]).toHaveAttribute('data-testid', 'publish-now-menu-item')
    expect(menuItems[1]).toHaveAttribute('data-testid', 'edit-schedule-menu-item')
    expect(menuItems[2]).toHaveAttribute('data-testid', 'delete-schedule-menu-item')

    // Verify all items are present
    expect(screen.getByTestId('publish-now-menu-item')).toBeInTheDocument()
    expect(screen.getByTestId('edit-schedule-menu-item')).toBeInTheDocument()
    expect(screen.getByTestId('delete-schedule-menu-item')).toBeInTheDocument()
  })

  it('should provide menu item props with correct values', () => {
    render(
      <TestProvider>
        <TestComponent options={{release: scheduledRelease}} />
      </TestProvider>,
    )

    expect(screen.getByTestId('publish-now-text')).toHaveTextContent('Publish now')
    expect(screen.getByTestId('edit-schedule-text')).toHaveTextContent('Edit schedule')
    expect(screen.getByTestId('delete-schedule-text')).toHaveTextContent('Delete schedule')
  })

  describe('publish now action', () => {
    it('should open dialog and call operation on success', async () => {
      render(
        <TestProvider>
          <TestComponent options={{release: scheduledRelease}} />
        </TestProvider>,
      )

      // Click menu item to open dialog
      await userEvent.click(screen.getByTestId('publish-now-menu-item'))
      expect(screen.getByTestId('publish-scheduled-draft-dialog')).toBeInTheDocument()

      // Confirm action
      await userEvent.click(screen.getByTestId('confirm-publish'))

      await waitFor(() => {
        expect(mockOperations.publishScheduledDraft).toHaveBeenCalledWith(scheduledRelease)
      })
    })

    it('should show error toast when operation fails', async () => {
      const error = new Error('Publish failed')
      mockOperations.publishScheduledDraft.mockRejectedValueOnce(error)

      render(
        <TestProvider>
          <TestComponent options={{release: scheduledRelease}} />
        </TestProvider>,
      )

      await userEvent.click(screen.getByTestId('publish-now-menu-item'))
      await userEvent.click(screen.getByTestId('confirm-publish'))

      await waitFor(() => {
        expect(mockToastPush).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'error',
            closable: true,
          }),
        )
      })
    })
  })

  describe('edit schedule action', () => {
    it('should open dialog and call operation on success', async () => {
      render(
        <TestProvider>
          <TestComponent options={{release: scheduledRelease}} />
        </TestProvider>,
      )

      // Click menu item to open dialog
      await userEvent.click(screen.getByTestId('edit-schedule-menu-item'))
      expect(screen.getByTestId('schedule-draft-dialog')).toBeInTheDocument()

      // Confirm action
      await userEvent.click(screen.getByTestId('confirm-reschedule'))

      await waitFor(() => {
        expect(mockOperations.rescheduleScheduledDraft).toHaveBeenCalledWith(
          scheduledRelease,
          new Date('2024-12-31T10:00:00Z'),
        )
      })
    })

    it('should show error toast when operation fails', async () => {
      const error = new Error('Reschedule failed')
      mockOperations.rescheduleScheduledDraft.mockRejectedValueOnce(error)

      render(
        <TestProvider>
          <TestComponent options={{release: scheduledRelease}} />
        </TestProvider>,
      )

      await userEvent.click(screen.getByTestId('edit-schedule-menu-item'))
      await userEvent.click(screen.getByTestId('confirm-reschedule'))

      await waitFor(() => {
        expect(mockToastPush).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'error',
            closable: true,
          }),
        )
      })
    })
  })

  describe('delete schedule action', () => {
    it('should open dialog and call operation on success', async () => {
      render(
        <TestProvider>
          <TestComponent options={{release: scheduledRelease}} />
        </TestProvider>,
      )

      // Click menu item to open dialog
      await userEvent.click(screen.getByTestId('delete-schedule-menu-item'))
      expect(screen.getByTestId('delete-scheduled-draft-dialog')).toBeInTheDocument()

      // Confirm action
      await userEvent.click(screen.getByTestId('confirm-delete'))

      await waitFor(() => {
        expect(mockOperations.deleteScheduledDraft).toHaveBeenCalledWith(scheduledRelease)
      })
    })
  })
})
