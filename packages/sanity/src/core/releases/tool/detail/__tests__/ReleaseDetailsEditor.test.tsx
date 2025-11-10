import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

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

describe('ReleaseDetailsEditor', () => {
  describe('when there is permission', () => {
    const initialRelease = {
      _id: 'release1',
      metadata: {
        title: 'Initial Title',
        description: '',
        releaseType: 'asap',
        intendedPublishAt: undefined,
      },
    } as ReleaseDocument

    beforeEach(async () => {
      vi.clearAllMocks()
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    })

    it('should call updateRelease after title change', async () => {
      const wrapper = await createTestProvider()
      const {container} = render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})

      const release = {
        _id: 'release1',
        metadata: {
          title: 'New Title',
          description: '',
          releaseType: 'asap',
          intendedPublishAt: undefined,
        },
      } as ReleaseDocument

      const input = screen.getByTestId('release-form-title') as HTMLInputElement

      await waitFor(() => {
        expect(input).not.toBeDisabled()
      })

      const updateReleaseMock = (useReleaseOperations as unknown as vi.Mock).mock.results[0]?.value
        .updateRelease

      await userEvent.clear(input)
      await userEvent.type(input, release.metadata.title!)

      // Wait for debounce (200ms) + some buffer
      await waitFor(
        () => {
          expect(updateReleaseMock).toHaveBeenCalledWith(release)
        },
        {timeout: 1000},
      )
    })

    it('should call updateRelease after description change', async () => {
      const wrapper = await createTestProvider()
      const {container} = render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})

      const release = {
        _id: 'release1',
        metadata: {
          title: 'Initial Title',
          description: 'woo hoo',
          releaseType: 'asap',
          intendedPublishAt: undefined,
        },
      } as ReleaseDocument

      const input = screen.getByTestId('release-form-description') as HTMLTextAreaElement

      await waitFor(() => {
        expect(input).not.toBeDisabled()
      })

      const updateReleaseMock = (useReleaseOperations as unknown as vi.Mock).mock.results[0]?.value
        .updateRelease

      await userEvent.clear(input)
      await userEvent.type(input, release.metadata.description!)

      // Wait for debounce (200ms) + some buffer
      await waitFor(
        () => {
          expect(updateReleaseMock).toHaveBeenCalledWith(release)
        },
        {timeout: 1000},
      )
    })
  })

  describe('when there is no permission', () => {
    const initialRelease = {
      _id: 'release1',
      metadata: {
        title: 'Initial Title',
        description: '',
        releaseType: 'asap',
        intendedPublishAt: undefined,
      },
    } as ReleaseDocument

    beforeEach(async () => {
      vi.clearAllMocks()
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnFalse)
    })

    it('when there is no permission, should not call updateRelease', async () => {
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})

      const input = screen.getByTestId('release-form-description')
      expect(input).toBeDisabled()
    })
  })
})
