import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnFalse,
  useReleasesPermissionsMockReturnTrue,
} from '../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {ReleaseDetailsEditor} from '../ReleaseDetailsEditor'

// Mock the dependencies
vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn().mockReturnValue({
    updateRelease: vi.fn(),
  }),
}))

vi.mock('../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

const initialRelease = {
  _id: 'release1',
  metadata: {
    title: 'Initial Title',
    description: 'A description',
    releaseType: 'asap',
    intendedPublishAt: undefined,
  },
} as ReleaseDocument

describe('ReleaseDetailsEditor', () => {
  describe('as a display surface', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    })

    it('renders the title and description as read-only display, not inline inputs', async () => {
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByTestId('release-title-display')).toHaveTextContent('Initial Title')
      expect(screen.getByTestId('release-description-display')).toHaveTextContent('A description')
      // The editable fields are not present on the page itself — they live in the edit dialog.
      expect(screen.queryByTestId('release-form-title')).toBeNull()
    })

    it('opens the edit dialog and saves changes via updateRelease', async () => {
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      const updateReleaseMock = (useReleaseOperations as unknown as vi.Mock).mock.results[0]?.value
        .updateRelease

      const editButton = await screen.findByTestId('edit-release-details-button')
      await userEvent.click(editButton)

      const titleInput = (await screen.findByTestId('release-form-title')) as HTMLTextAreaElement
      await userEvent.clear(titleInput)
      await userEvent.type(titleInput, 'New Title')

      await userEvent.click(screen.getByTestId('save-release-details-button'))

      await waitFor(() => {
        expect(updateReleaseMock).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({title: 'New Title'}),
          }),
        )
      })
    })
  })

  describe('when there is no permission', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnFalse)
    })

    it('does not show the edit affordance', async () => {
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.queryByTestId('edit-release-details-button')).toBeNull()
    })
  })
})
