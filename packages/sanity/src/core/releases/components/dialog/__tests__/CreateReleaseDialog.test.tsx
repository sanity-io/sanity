import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {useReleaseOperationsMockReturn} from '../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {CreateReleaseDialog} from '../CreateReleaseDialog'

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../hooks/useGuardWithReleaseLimitUpsell', () => ({
  useGuardWithReleaseLimitUpsell: vi.fn(() => ({
    releasePromise: Promise.resolve(true),
  })),
}))

describe('CreateReleaseDialog', () => {
  describe('when creating a new release', () => {
    const onCancelMock = vi.fn()
    const onSubmitMock = vi.fn()

    const prerenderTest = async () => {
      const wrapper = await createTestProvider()
      render(<CreateReleaseDialog onCancel={onCancelMock} onSubmit={onSubmitMock} />, {wrapper})

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
        },
        {timeout: 5000, interval: 500},
      )
    }

    beforeEach(async () => {
      onCancelMock.mockClear()
      onSubmitMock.mockClear()
    })

    it('should render the dialog', async () => {
      await prerenderTest()

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should call onCancel when dialog is closed', async () => {
      await prerenderTest()

      await userEvent.click(screen.getByRole('button', {name: /close/i}))

      expect(onCancelMock).toHaveBeenCalled()
    })

    it('should call createRelease and onCreate when form is submitted', async () => {
      await prerenderTest()

      const value: Partial<ReleaseDocument> = activeASAPRelease

      const titleInput = screen.getByTestId('release-form-title')
      await userEvent.type(titleInput, value.metadata?.title || '')

      const submitButton = screen.getByTestId('submit-release-button')

      // Wait for the button to be enabled after typing
      await waitFor(() => {
        expect(submitButton.closest('button')).not.toBeDisabled()
      })

      await userEvent.click(submitButton)

      await waitFor(
        () => {
          expect(onSubmitMock).toHaveBeenCalledOnce()
          expect(useReleaseOperationsMockReturn.createRelease).toHaveBeenCalledWith(
            expect.objectContaining({
              _id: expect.stringContaining('releases'),
            }),
          )
        },
        {timeout: 3000},
      )
    })
  })
})
