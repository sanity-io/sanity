import {fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type ReleaseDocument, useReleases} from '../../../../store'
import {useReleaseOperations} from '../../../../store/release/useReleaseOperations'
import {usePerspective} from '../../../hooks/usePerspective'
import {ReleaseDetailsDialog} from '../ReleaseDetailsDialog'

vi.mock('../../../../store/release', () => ({
  useReleases: vi.fn(),
}))

vi.mock('../../../../store/release/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn().mockReturnValue({
    createRelease: vi.fn(),
    updateRelease: vi.fn(),
  }),
}))

vi.mock('../../../hooks/usePerspective', () => ({
  usePerspective: vi.fn().mockReturnValue({
    setPerspective: vi.fn(),
  }),
}))

vi.mock('../../../i18n/hooks/useTranslation', () => ({
  useTranslate: vi.fn().mockReturnValue({
    t: vi.fn(),
  }),
}))

const mockUseBundleStore = useReleases as Mock<typeof useReleases>
//const mockUseDateTimeFormat = useDateTimeFormat as Mock

describe('ReleaseDetailsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('when creating a new release', () => {
    const onCancelMock = vi.fn()
    const onSubmitMock = vi.fn()

    beforeEach(async () => {
      onCancelMock.mockClear()
      onSubmitMock.mockClear()

      mockUseBundleStore.mockReturnValue({
        data: [],
        loading: true,
        dispatch: vi.fn(),
        error: undefined,
        releasesIds: [],
        archivedReleases: [],
      })

      //mockUseDateTimeFormat.mockReturnValue({format: vi.fn().mockReturnValue('Mocked date')})

      const wrapper = await createTestProvider()
      render(<ReleaseDetailsDialog onCancel={onCancelMock} onSubmit={onSubmitMock} />, {wrapper})
    })

    it('should render the dialog', () => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should call onCancel when dialog is closed', () => {
      fireEvent.click(screen.getByRole('button', {name: /close/i}))

      expect(onCancelMock).toHaveBeenCalled()
    })

    it('should call createRelease, setPerspective, and onCreate when form is submitted', async () => {
      const value: Partial<ReleaseDocument> = {
        metadata: {
          title: 'Bundle 1',
          description: undefined,
          intendedPublishAt: undefined,
          releaseType: 'asap',
        },
      }

      const titleInput = screen.getByTestId('release-form-title')
      fireEvent.change(titleInput, {target: {value: value.metadata?.title}})

      const submitButton = screen.getByTestId('submit-release-button')
      fireEvent.click(submitButton)

      expect(useReleaseOperations().createRelease).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.stringContaining('releases'),
          ...value,
        }),
      )
      await Promise.resolve()

      expect(usePerspective().setPerspective).toHaveBeenCalledOnce()

      expect(onSubmitMock).toHaveBeenCalled()
    })
  })
})
