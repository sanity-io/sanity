import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {type BundleDocument, type FormBundleDocument, useDateTimeFormat} from 'sanity'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useBundles} from '../../../../store/bundles'
import {ReleaseForm} from '../ReleaseForm'

jest.mock('../../../../../core/hooks/useDateTimeFormat', () => ({
  useDateTimeFormat: jest.fn(),
}))

jest.mock('../../../../store/bundles', () => ({
  useBundles: jest.fn(),
}))

const mockUseBundleStore = useBundles as jest.Mock<typeof useBundles>
const mockUseDateTimeFormat = useDateTimeFormat as jest.Mock

describe('ReleaseForm', () => {
  const onChangeMock = jest.fn()
  const onErrorMock = jest.fn()
  const valueMock: FormBundleDocument = {
    _id: 'very-random',
    _type: 'release',
    title: '',
    description: '',
    icon: 'cube',
    hue: 'gray',
    //publishAt: undefined,
  }

  describe('when creating a new bundle', () => {
    beforeEach(async () => {
      onChangeMock.mockClear()
      onErrorMock.mockClear()

      // Mock the data returned by useBundles hook
      const mockData: BundleDocument[] = [
        {
          description: 'What a spring drop, allergies galore 🌸',
          _updatedAt: '2024-07-12T10:39:32Z',
          _rev: 'HdJONGqRccLIid3oECLjYZ',
          authorId: 'pzAhBTkNX',
          title: 'Spring Drop',
          icon: 'heart-filled',
          _id: 'db76c50e-358b-445c-a57c-8344c588a5d5',
          _type: 'release',
          hue: 'magenta',
          _createdAt: '2024-07-02T11:37:51Z',
        },
        // Add more mock data if needed
      ]
      mockUseBundleStore.mockReturnValue({
        data: mockData,
        loading: false,
        dispatch: jest.fn(),
        error: undefined,
        deletedBundles: {},
      })

      mockUseDateTimeFormat.mockReturnValue({format: jest.fn().mockReturnValue('Mocked date')})

      const wrapper = await createTestProvider()
      render(<ReleaseForm onChange={onChangeMock} value={valueMock} />, {
        wrapper,
      })
    })

    it('should render the form fields', () => {
      expect(screen.getByTestId('release-form-title')).toBeInTheDocument()
      expect(screen.getByTestId('release-form-description')).toBeInTheDocument()
      //expect(screen.getByTestId('release-form-publish-at')).toBeInTheDocument()
    })

    it('should call onChange when title input value changes', () => {
      const titleInput = screen.getByTestId('release-form-title')
      fireEvent.change(titleInput, {target: {value: 'Bundle 1'}})

      expect(onChangeMock).toHaveBeenCalledWith({...valueMock, title: 'Bundle 1'})
    })

    it('should call onChange when description textarea value changes', () => {
      const descriptionTextarea = screen.getByTestId('release-form-description')
      fireEvent.change(descriptionTextarea, {target: {value: 'New Description'}})

      expect(onChangeMock).toHaveBeenCalledWith({...valueMock, description: 'New Description'})
    })

    /*it('should call onChange when publishAt input value changes', () => {
    const publishAtInput = screen.getByTestId('release-form-publish-at')
    fireEvent.change(publishAtInput, {target: {value: '2022-01-01'}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, publishAt: '2022-01-01'})
  })

  it('should call onChange with undefined when publishAt input value is empty', () => {
    const publishAtInput = screen.getByTestId('release-form-publish-at')
    fireEvent.change(publishAtInput, {target: {value: ' '}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, publishAt: ''})
  })*/

    /*it('should show an error when the publishAt input value is invalid', () => {
    const publishAtInput = screen.getByTestId('release-form-publish-at')
    fireEvent.change(publishAtInput, {target: {value: 'invalid-date'}})

    expect(screen.getByTestId('input-validation-icon-error')).toBeInTheDocument()
  })*/
  })

  describe('when updating an existing bundle', () => {
    const existingBundleValue: BundleDocument = {
      title: 'Summer Drop',
      description: 'Summer time',
      icon: 'heart-filled',
      hue: 'magenta',
    } as BundleDocument
    beforeEach(async () => {
      onChangeMock.mockClear()
      onErrorMock.mockClear()

      // Mock the data returned by useBundles hook
      const mockData: BundleDocument[] = [
        {
          description: 'What a spring drop, allergies galore 🌸',
          _updatedAt: '2024-07-12T10:39:32Z',
          _rev: 'HdJONGqRccLIid3oECLjYZ',
          authorId: 'pzAhBTkNX',
          title: 'Spring Drop',
          icon: 'heart-filled',
          _id: 'db76c50e',
          _type: 'release',
          hue: 'magenta',
          _createdAt: '2024-07-02T11:37:51Z',
        },
        // Add more mock data if needed
      ]
      mockUseBundleStore.mockReturnValue({
        data: mockData,
        loading: false,
        dispatch: jest.fn(),
        deletedBundles: {} as Record<string, BundleDocument>,
      })

      mockUseDateTimeFormat.mockReturnValue({format: jest.fn().mockReturnValue('Mocked date')})

      const wrapper = await createTestProvider()
      render(<ReleaseForm onChange={onChangeMock} value={existingBundleValue} />, {
        wrapper,
      })
    })

    it('should allow for any title to be used', async () => {
      const titleInput = screen.getByTestId('release-form-title')
      expect(titleInput).toHaveValue(existingBundleValue.title)
      // the slug of this title already exists,
      // but the slug for the existing edited bundle will not be changed
      fireEvent.change(titleInput, {target: {value: 'Spring Drop'}})

      expect(screen.queryByTestId('input-validation-icon-error')).not.toBeInTheDocument()
    })

    it('should populate the form with the existing bundle values', () => {
      expect(screen.getByTestId('release-form-title')).toHaveValue(existingBundleValue.title)
      expect(screen.getByTestId('release-form-description')).toHaveValue(
        existingBundleValue.description,
      )
      screen.getByTestId('release-badge-color-magenta')
      screen.getByTestId('release-badge-icon-heart-filled')
    })
  })
})
