import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

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
  describe('production (inline editing)', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    })

    it('renders inline title and description fields', async () => {
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByTestId('release-form-title')).toHaveValue('Initial Title')
      expect(screen.queryByTestId('release-title-display')).toBeNull()
    })

    it('debounces changes and saves via updateRelease', async () => {
      vi.useFakeTimers({shouldAdvanceTime: true})
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      const updateReleaseMock = (useReleaseOperations as unknown as Mock).mock.results[0]?.value
        .updateRelease

      const titleInput = screen.getByTestId('release-form-title') as HTMLTextAreaElement
      await userEvent.clear(titleInput)
      await userEvent.type(titleInput, 'New Title')

      await vi.advanceTimersByTimeAsync(250)

      await waitFor(() => {
        expect(updateReleaseMock).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({title: 'New Title'}),
          }),
        )
      })
      vi.useRealTimers()
    })
  })

  describe('with beta.variants (read-only identity)', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    })

    it('renders the title and description as read-only display, not inline inputs', async () => {
      const wrapper = await createTestProvider({
        config: {beta: {variants: {enabled: true}}},
      })
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByTestId('release-title-display')).toHaveTextContent('Initial Title')
      expect(screen.getByTestId('release-description-display')).toHaveTextContent('A description')
      expect(screen.queryByTestId('release-form-title')).toBeNull()
    })
  })

  describe('when there is no permission', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnFalse)
    })

    it('disables inline fields in production', async () => {
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByTestId('release-form-title')).toBeDisabled()
    })
  })
})
