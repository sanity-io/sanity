import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {render, screen} from '@testing-library/react'
import {type BundleDocument} from 'sanity'

import {BundleForm} from '../BundleForm'

jest.mock('sanity', () => ({
  ...(jest.requireActual('sanity') || {}),
  useDateTimeFormat: jest.fn().mockReturnValue({format: jest.fn().mockReturnValue('Mocked date')}),
}))

jest.mock('@sanity/ui', () => ({
  ...(jest.requireActual('@sanity/ui') || {}),
  // eslint-disable-next-line camelcase
  useTheme_v2: jest.fn().mockReturnValue({color: {}}),
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

  beforeEach(() => {
    onChangeMock.mockClear()
  })

  it('should render the form fields', async () => {
    render(<BundleForm onChange={onChangeMock} value={valueMock} />)

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Schedule for publishing at')).toBeInTheDocument()
  })

  /*it('should call onChange when title input value changes', () => {
    renderBundleForm()

    const titleInput = screen.getByLabelText('Title')
    fireEvent.change(titleInput, {target: {value: 'Bundle 1'}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, title: 'Bundle 1', name: 'bundle-1'})
  })

  it('should call onChange when description textarea value changes', () => {
    renderBundleForm()

    const descriptionTextarea = screen.getByLabelText('Description')
    fireEvent.change(descriptionTextarea, {target: {value: 'New Description'}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, description: 'New Description'})
  })

  it('should call onChange when publishAt input value changes', () => {
    renderBundleForm()

    const publishAtInput = screen.getByLabelText('Schedule for publishing at')
    fireEvent.change(publishAtInput, {target: {value: '2022-01-01'}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, publishAt: '2022-01-01'})
  })

  it('should call onChange with undefined when publishAt input value is empty', () => {
    renderBundleForm()

    const publishAtInput = screen.getByLabelText('Schedule for publishing at')
    fireEvent.change(publishAtInput, {target: {value: ''}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, publishAt: undefined})
  })*/
})
