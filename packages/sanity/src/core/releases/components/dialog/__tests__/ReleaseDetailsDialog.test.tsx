import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {type BundleDocument, useBundles} from 'sanity'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {usePerspective} from '../../../../bundles/hooks/usePerspective'
import {useBundleOperations} from '../../../../store/bundles/useBundleOperations'
import {ReleaseDetailsDialog} from '../ReleaseDetailsDialog'

/*jest.mock('../../../../../core/hooks/useDateTimeFormat', () => ({
  useDateTimeFormat: jest.fn(),
}))*/

jest.mock('../../../../store/bundles', () => ({
  useBundles: jest.fn(),
}))

jest.mock('../../../../store/bundles/useBundleOperations', () => ({
  useBundleOperations: jest.fn().mockReturnValue({
    createBundle: jest.fn(),
    updateBundle: jest.fn(),
  }),
}))

jest.mock('../../../../bundles/hooks/usePerspective', () => ({
  usePerspective: jest.fn().mockReturnValue({
    setPerspective: jest.fn(),
  }),
}))

const mockUseBundleStore = useBundles as jest.Mock<typeof useBundles>
//const mockUseDateTimeFormat = useDateTimeFormat as jest.Mock

describe('ReleaseDetailsDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when creating a new bundle', () => {
    const onCancelMock = jest.fn()
    const onSubmitMock = jest.fn()

    beforeEach(async () => {
      onCancelMock.mockClear()
      onSubmitMock.mockClear()

      mockUseBundleStore.mockReturnValue({
        data: [],
        loading: true,
        dispatch: jest.fn(),
        error: undefined,
        deletedBundles: {},
      })

      //mockUseDateTimeFormat.mockReturnValue({format: jest.fn().mockReturnValue('Mocked date')})

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

    it('should call createBundle, setPerspective, and onCreate when form is submitted with a valid slug', async () => {
      const value: Partial<BundleDocument> = {
        _type: 'release',
        title: 'Bundle 1',
        hue: 'gray',
        icon: 'cube',
        //publishAt: undefined,
      }

      const titleInput = screen.getByTestId('release-form-title')
      fireEvent.change(titleInput, {target: {value: value.title}})

      const submitButton = screen.getByTestId('submit-release-button')
      fireEvent.click(submitButton)

      await expect(useBundleOperations().createBundle).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.stringMatching(/r\w{8}/),
          ...value,
        }),
      )

      expect(usePerspective().setPerspective).toHaveBeenCalledWith(expect.stringMatching(/r\w{8}/))
      expect(onSubmitMock).toHaveBeenCalled()
    })
  })

  describe('when updating an existing bundle', () => {
    const onCancelMock = jest.fn()
    const onSubmitMock = jest.fn()
    const existingBundleValue: BundleDocument = {
      _id: 'existing-bundle',
      _type: 'release',
      _rev: '123',
      _createdAt: '2024-07-02T11:37:51Z',
      _updatedAt: '2024-07-12T10:39:32Z',
      authorId: '123',
      description: 'Existing bundle description',
      hue: 'magenta',
      icon: 'cube',
      title: 'Existing bundle',
    }

    beforeEach(async () => {
      onCancelMock.mockClear()
      onSubmitMock.mockClear()

      mockUseBundleStore.mockReturnValue({
        data: [],
        loading: true,
        dispatch: jest.fn(),
        error: undefined,
        deletedBundles: {},
      })

      //mockUseDateTimeFormat.mockReturnValue({format: jest.fn().mockReturnValue('Mocked date')})

      const wrapper = await createTestProvider()
      render(
        <ReleaseDetailsDialog
          onCancel={onCancelMock}
          onSubmit={onSubmitMock}
          bundle={existingBundleValue}
        />,
        {wrapper},
      )
    })

    it('should have edit title and CTA label', () => {
      expect(screen.getAllByText('Edit release')).toHaveLength(2)
      within(screen.getByTestId('submit-release-button')).getByText('Edit release')
    })

    it('should disable edit CTA when no title entered', () => {
      expect(screen.getByTestId('release-form-title')).toHaveValue(existingBundleValue.title)
      fireEvent.change(screen.getByTestId('release-form-title'), {target: {value: ''}})

      expect(screen.getByTestId('submit-release-button')).toBeDisabled()

      // whitespace should be trimmed
      fireEvent.change(screen.getByTestId('release-form-title'), {target: {value: '   '}})

      expect(screen.getByTestId('submit-release-button')).toBeDisabled()
    })

    it('should patch the bundle document when submitted', () => {
      fireEvent.change(screen.getByTestId('release-form-title'), {target: {value: 'New title  '}})
      fireEvent.change(screen.getByTestId('release-form-description'), {
        target: {value: 'New description'},
      })
      fireEvent.click(screen.getByTestId('submit-release-button'))

      const {hue, icon, _id} = existingBundleValue
      expect(useBundleOperations().updateBundle).toHaveBeenCalledWith({
        _id,
        _type: 'release',
        hue,
        icon,
        title: 'New title',
        description: 'New description',
      })
    })

    it('should not change the perspective', async () => {
      fireEvent.click(screen.getByTestId('submit-release-button'))

      await waitFor(() => {
        expect(useBundleOperations().updateBundle).toHaveBeenCalled()
      })

      expect(usePerspective().setPerspective).not.toHaveBeenCalled()
    })
  })
})
