import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {type BundleDocument} from 'sanity'

import {createWrapper} from '../../../util/__tests__/createWrapper'
import {BundleForm} from '../BundleForm'

jest.mock('sanity', () => ({
  ...(jest.requireActual('sanity') || {}),
  useDateTimeFormat: jest.fn().mockReturnValue({format: jest.fn().mockReturnValue('Mocked date')}),
}))

const renderBundleForm = async (onChangeMock: jest.Mock, valueMock: Partial<BundleDocument>) => {
  const wrapper = await createWrapper()
  render(<BundleForm onChange={onChangeMock} value={valueMock} />, {wrapper})
}

describe('BundleForm', () => {
  const onChangeMock = jest.fn()
  const valueMock: Partial<BundleDocument> = {
    title: '',
    description: '',
    icon: 'cube',
    hue: 'gray',
    publishAt: undefined,
  }

  beforeEach(() => {
    onChangeMock.mockClear()

    renderBundleForm(onChangeMock, valueMock)
  })

  it('should render the form fields', async () => {
    expect(screen.getByTestId('bundle-form-title')).toBeInTheDocument()
    expect(screen.getByTestId('bundle-form-description')).toBeInTheDocument()
    expect(screen.getByTestId('bundle-form-publish-at')).toBeInTheDocument()
  })

  it('should call onChange when title input value changes', () => {
    const titleInput = screen.getByLabelText('Title')
    fireEvent.change(titleInput, {target: {value: 'Bundle 1'}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, title: 'Bundle 1', name: 'bundle-1'})
  })

  it('should call onChange when description textarea value changes', () => {
    const descriptionTextarea = screen.getByLabelText('Description')
    fireEvent.change(descriptionTextarea, {target: {value: 'New Description'}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, description: 'New Description'})
  })

  it('should call onChange when publishAt input value changes', () => {
    const publishAtInput = screen.getByLabelText('Schedule for publishing at')
    fireEvent.change(publishAtInput, {target: {value: '2022-01-01'}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, publishAt: '2022-01-01'})
  })

  it('should call onChange with undefined when publishAt input value is empty', () => {
    const publishAtInput = screen.getByLabelText('Schedule for publishing at')
    fireEvent.change(publishAtInput, {target: {value: ''}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, publishAt: undefined})
  })
})
