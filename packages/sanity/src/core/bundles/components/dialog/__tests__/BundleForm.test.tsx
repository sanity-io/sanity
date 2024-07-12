import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {type BundleDocument} from 'sanity'

import {createWrapper} from '../../../util/tests/createWrapper'
import {BundleForm} from '../BundleForm'

jest.mock('sanity', () => ({
  useDateTimeFormat: jest.fn().mockReturnValue({format: jest.fn().mockReturnValue('Mocked date')}),
  useTranslation: jest.fn().mockReturnValue({t: jest.fn().mockReturnValue('Mocked translation')}),
}))

describe('BundleForm', () => {
  const onChangeMock = jest.fn()
  const valueMock: Partial<BundleDocument> = {
    title: '',
    description: '',
    icon: 'cube',
    hue: 'gray',
    publishAt: undefined,
  }

  beforeEach(async () => {
    onChangeMock.mockClear()

    const wrapper = await createWrapper()
    render(<BundleForm onChange={onChangeMock} value={valueMock} />, {wrapper})
  })

  it('should render the form fields', async () => {
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
})
