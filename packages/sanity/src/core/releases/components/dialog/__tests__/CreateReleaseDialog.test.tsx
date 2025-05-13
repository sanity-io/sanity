import {type ReleaseDocument} from '@sanity/client'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {useReleaseOperationsMockReturn} from '../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {CreateReleaseDialog} from '../CreateReleaseDialog'

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

describe('CreateReleaseDialog', () => {
  describe('when creating a new release', () => {
    const onCancelMock = vi.fn()
    const onSubmitMock = vi.fn()

    beforeEach(async () => {
      onCancelMock.mockClear()
      onSubmitMock.mockClear()

      const wrapper = await createTestProvider()
      render(<CreateReleaseDialog onCancel={onCancelMock} onSubmit={onSubmitMock} />, {wrapper})

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
        },
        {timeout: 5000, interval: 500},
      )
    })

    it('should render the dialog', () => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should call onCancel when dialog is closed', () => {
      fireEvent.click(screen.getByRole('button', {name: /close/i}))

      expect(onCancelMock).toHaveBeenCalled()
    })

    it('should call createRelease and onCreate when form is submitted', async () => {
      const value: Partial<ReleaseDocument> = activeASAPRelease

      act(async () => {
        const titleInput = screen.getByTestId('release-form-title')
        fireEvent.change(titleInput, {target: {value: value.metadata?.title}})

        const submitButton = screen.getByTestId('submit-release-button')
        fireEvent.click(submitButton)

        waitFor(async () => {
          await Promise.resolve()

          expect(onSubmitMock).toHaveBeenCalledOnce()
          expect(useReleaseOperationsMockReturn.createRelease).toHaveBeenCalledWith(
            expect.objectContaining({
              _id: expect.stringContaining('releases'),
            }),
          )
        })
      })
    })
  })
})
