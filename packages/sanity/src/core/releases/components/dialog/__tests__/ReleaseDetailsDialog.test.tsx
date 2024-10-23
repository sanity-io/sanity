import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type ReleaseDocument, useReleases} from '../../../../store'
import {useReleaseOperations} from '../../../../store/release/useReleaseOperations'
import {usePerspective} from '../../../hooks/usePerspective'
import {ReleaseDetailsDialog} from '../ReleaseDetailsDialog'

/*vi.mock('../../../../../core/hooks/useDateTimeFormat', () => ({
  useDateTimeFormat: vi.fn(),
}))*/

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
        deletedReleases: {},
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

    it('should call createRelease, setPerspective, and onCreate when form is submitted with a valid slug', async () => {
      const value: Partial<ReleaseDocument> = {
        metadata: {
          title: 'Bundle 1',
          hue: 'gray',
          icon: 'cube',
          releaseType: 'asap',
        },
      }

      const titleInput = screen.getByTestId('release-form-title')
      fireEvent.change(titleInput, {target: {value: value.metadata?.title}})

      const submitButton = screen.getByTestId('submit-release-button')
      fireEvent.click(submitButton)

      expect(useReleaseOperations().createRelease).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.stringMatching(/system-tmp-releases\.r\w{8}$/),
          ...value,
        }),
      )
      await Promise.resolve()

      expect(usePerspective().setPerspective).toHaveBeenCalledOnce()

      expect(usePerspective().setPerspective).toHaveBeenCalledWith(
        expect.stringMatching(/system-tmp-releases\.r\w{8}$/),
      )
      expect(onSubmitMock).toHaveBeenCalled()
    })
  })

  describe('when updating an existing release', () => {
    const onCancelMock = vi.fn()
    const onSubmitMock = vi.fn()
    const existingBundleValue: ReleaseDocument = {
      _id: 'existing-release',
      name: 'existing',
      state: 'active',
      _type: 'system-tmp.release',
      _createdAt: '2024-07-02T11:37:51Z',
      _updatedAt: '2024-07-12T10:39:32Z',
      createdBy: '123',
      metadata: {
        description: 'Existing release description',
        releaseType: 'asap',
        hue: 'magenta',
        icon: 'cube',
        title: 'Existing release',
      },
    }

    beforeEach(async () => {
      onCancelMock.mockClear()
      onSubmitMock.mockClear()

      mockUseBundleStore.mockReturnValue({
        data: [],
        loading: true,
        dispatch: vi.fn(),
        error: undefined,
        deletedReleases: {},
      })

      //mockUseDateTimeFormat.mockReturnValue({format: vi.fn().mockReturnValue('Mocked date')})

      const wrapper = await createTestProvider()
      render(
        <ReleaseDetailsDialog
          onCancel={onCancelMock}
          onSubmit={onSubmitMock}
          release={existingBundleValue}
        />,
        {wrapper},
      )
    })

    it('should have edit title and CTA label', () => {
      expect(screen.getAllByText('Edit release')).toHaveLength(2)
      within(screen.getByTestId('submit-release-button')).getByText('Edit release')
    })

    it('should disable edit CTA when no title entered', () => {
      expect(screen.getByTestId('release-form-title')).toHaveValue(
        existingBundleValue.metadata.title,
      )
      fireEvent.change(screen.getByTestId('release-form-title'), {target: {value: ''}})

      expect(screen.getByTestId('submit-release-button')).toBeDisabled()

      // whitespace should be trimmed
      fireEvent.change(screen.getByTestId('release-form-title'), {target: {value: '   '}})

      expect(screen.getByTestId('submit-release-button')).toBeDisabled()
    })

    it('should patch the release document when submitted', () => {
      fireEvent.change(screen.getByTestId('release-form-title'), {target: {value: 'New title  '}})
      fireEvent.change(screen.getByTestId('release-form-description'), {
        target: {value: 'New description'},
      })
      fireEvent.click(screen.getByTestId('submit-release-button'))

      const {
        metadata: {hue, icon},
        _id,
      } = existingBundleValue

      expect(useReleaseOperations().updateRelease).toHaveBeenCalledWith({
        _id,
        metadata: {
          hue,
          icon,
          title: 'New title',
          description: 'New description',
          releaseType: 'asap',
        },
      } satisfies Partial<ReleaseDocument>)
    })

    it('should not change the perspective', async () => {
      fireEvent.click(screen.getByTestId('submit-release-button'))

      await waitFor(() => {
        expect(useReleaseOperations().updateRelease).toHaveBeenCalled()
      })

      expect(usePerspective().setPerspective).not.toHaveBeenCalled()
    })
  })
})
