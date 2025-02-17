import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type ReleaseDocument} from '../../../index'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
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
    beforeEach(async () => {
      const initialRelease = {
        _id: 'release1',
        metadata: {
          title: 'Initial Title',
          description: '',
          releaseType: 'asap',
          intendedPublishAt: undefined,
        },
      } as ReleaseDocument

      mockUseReleasePermissions.mockReturnValue({
        checkWithPermissionGuard: async () => true,
      })
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
    })

    it('should call updateRelease after title change', () => {
      const release = {
        _id: 'release1',
        metadata: {
          title: 'New Title',
          description: '',
          releaseType: 'asap',
          intendedPublishAt: undefined,
        },
      } as ReleaseDocument

      const input = screen.getByTestId('release-form-title')
      fireEvent.change(input, {target: {value: release.metadata.title}})

      waitFor(
        () => {
          expect(useReleaseOperations().updateRelease).toHaveBeenCalledWith(release)
        },
        {timeout: 10_000},
      )
    })

    it('should call updateRelease after description change', () => {
      const release = {
        _id: 'release1',
        metadata: {
          title: 'Initial Title',
          description: 'woo hoo',
          releaseType: 'asap',
          intendedPublishAt: undefined,
        },
      } as ReleaseDocument

      const input = screen.getByTestId('release-form-description')
      fireEvent.change(input, {target: {value: release.metadata.description}})

      waitFor(
        () => {
          expect(useReleaseOperations().updateRelease).toHaveBeenCalledWith(release)
        },
        {timeout: 10_000},
      )
    })
  })

  describe('when there is no permission', () => {
    beforeEach(async () => {
      const initialRelease = {
        _id: 'release1',
        metadata: {
          title: 'Initial Title',
          description: '',
          releaseType: 'asap',
          intendedPublishAt: undefined,
        },
      } as ReleaseDocument

      mockUseReleasePermissions.mockReturnValue({
        checkWithPermissionGuard: async () => false,
      })
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
    })

    it('when there is no permission, should not call updateRelease', async () => {
      const input = screen.getByTestId('release-form-description')
      expect(input).toBeDisabled()
    })
  })
})
