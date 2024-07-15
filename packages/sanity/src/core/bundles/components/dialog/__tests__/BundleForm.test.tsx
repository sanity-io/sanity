import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {type BundleDocument, useDateTimeFormat} from 'sanity'

import {useBundles} from '../../../../store/bundles'
import {createWrapper} from '../../../util/tests/createWrapper'
import {BundleForm} from '../BundleForm'

jest.mock('../../../../../core/hooks/useDateTimeFormat', () => ({
  useDateTimeFormat: jest.fn(),
}))

jest.mock('../../../../store/bundles', () => ({
  useBundles: jest.fn(),
}))

const mockUseBundleStore = useBundles as jest.Mock<typeof useBundles>
const mockUseDateTimeFormat = useDateTimeFormat as jest.Mock

describe('BundleForm', () => {
  const onChangeMock = jest.fn()
  const onErrorMock = jest.fn()
  const valueMock: Partial<BundleDocument> = {
    title: '',
    description: '',
    icon: 'cube',
    hue: 'gray',
    publishAt: undefined,
  }

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
        _type: 'bundle',
        name: 'spring-drop',
        hue: 'magenta',
        _createdAt: '2024-07-02T11:37:51Z',
      },
      // Add more mock data if needed
    ]
    mockUseBundleStore.mockReturnValue({data: mockData, loading: false, dispatch: jest.fn()})

    mockUseDateTimeFormat.mockReturnValue({format: jest.fn().mockReturnValue('Mocked date')})

    const wrapper = await createWrapper()
    render(<BundleForm onChange={onChangeMock} value={valueMock} onError={onErrorMock} />, {
      wrapper,
    })
  })

  it('should render the form fields', () => {
    expect(screen.getByTestId('bundle-form-title')).toBeInTheDocument()
    expect(screen.getByTestId('bundle-form-description')).toBeInTheDocument()
    expect(screen.getByTestId('bundle-form-publish-at')).toBeInTheDocument()
  })

  it('should call onChange when title input value changes', () => {
    const titleInput = screen.getByTestId('bundle-form-title')
    fireEvent.change(titleInput, {target: {value: 'Bundle 1'}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, title: 'Bundle 1', name: 'bundle-1'})
  })

  it('should call onChange when description textarea value changes', () => {
    const descriptionTextarea = screen.getByTestId('bundle-form-description')
    fireEvent.change(descriptionTextarea, {target: {value: 'New Description'}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, description: 'New Description'})
  })

  it('should call onChange when publishAt input value changes', () => {
    const publishAtInput = screen.getByTestId('bundle-form-publish-at')
    fireEvent.change(publishAtInput, {target: {value: '2022-01-01'}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, publishAt: '2022-01-01'})
  })

  it('should call onChange with undefined when publishAt input value is empty', () => {
    const publishAtInput = screen.getByTestId('bundle-form-publish-at')
    fireEvent.change(publishAtInput, {target: {value: ' '}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, publishAt: ''})
  })

  it('should show an error when the title is "drafts"', () => {
    const titleInput = screen.getByTestId('bundle-form-title')

    fireEvent.change(titleInput, {target: {value: 'drafts'}})

    expect(screen.getByTestId('input-validation-icon-error')).toBeInTheDocument()
  })

  it('should show an error when the title is "published"', () => {
    const titleInput = screen.getByTestId('bundle-form-title')
    fireEvent.change(titleInput, {target: {value: 'published'}})

    expect(screen.getByTestId('input-validation-icon-error')).toBeInTheDocument()
  })

  it('should show an error when the bundle already exists', () => {
    const titleInput = screen.getByTestId('bundle-form-title')
    fireEvent.change(titleInput, {target: {value: 'Spring Drop'}})

    expect(screen.getByTestId('input-validation-icon-error')).toBeInTheDocument()
  })

  it('should show an error when the title is empty', () => {
    const titleInput = screen.getByTestId('bundle-form-title')
    fireEvent.change(titleInput, {target: {value: 'test'}}) // Set a valid title first
    fireEvent.change(titleInput, {target: {value: ' '}}) // remove the title

    expect(screen.getByTestId('input-validation-icon-error')).toBeInTheDocument()
  })

  it('should show an error when the publishAt input value is invalid', () => {
    const publishAtInput = screen.getByTestId('bundle-form-publish-at')
    fireEvent.change(publishAtInput, {target: {value: 'invalid-date'}})

    expect(screen.getByTestId('input-validation-icon-error')).toBeInTheDocument()
  })
})
