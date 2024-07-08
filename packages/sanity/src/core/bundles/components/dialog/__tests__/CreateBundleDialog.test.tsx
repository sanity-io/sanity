import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {type BundleDocument} from 'sanity'

import {useBundleOperations} from '../../../../store/bundles/useBundleOperations'
import {usePerspective} from '../../../hooks/usePerspective'
import {createWrapper} from '../../../util/tests/createWrapper'
import {CreateBundleDialog} from '../CreateBundleDialog'

jest.mock('sanity', () => ({
  useDateTimeFormat: jest.fn().mockReturnValue({format: jest.fn().mockReturnValue('Mocked date')}),
  useTranslation: jest.fn().mockReturnValue({t: jest.fn().mockReturnValue('Mocked translation')}),
}))

jest.mock('../../../../store/bundles/useBundleOperations', () => ({
  useBundleOperations: jest.fn().mockReturnValue({
    createBundle: jest.fn(),
  }),
}))

jest.mock('../../../hooks/usePerspective', () => ({
  usePerspective: jest.fn().mockReturnValue({
    setPerspective: jest.fn(),
  }),
}))

describe('CreateBundleDialog', () => {
  const onCancelMock = jest.fn()
  const onCreateMock = jest.fn()

  beforeEach(async () => {
    onCancelMock.mockClear()
    onCreateMock.mockClear()

    const wrapper = await createWrapper()
    render(<CreateBundleDialog onCancel={onCancelMock} onCreate={onCreateMock} />, {wrapper})
  })

  it('should render the dialog', () => {
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should call onCancel when dialog is closed', () => {
    fireEvent.click(screen.getByRole('button', {name: /close/i}))

    expect(onCancelMock).toHaveBeenCalled()
  })

  it('should call createBundle, setPerspective, and onCreate when form is submitted with a valid name', async () => {
    const value: Partial<BundleDocument> = {
      name: 'bundle-1',
      title: 'Bundle 1',
      hue: 'gray',
      icon: 'cube',
      publishAt: undefined,
    }

    const titleInput = screen.getByTestId('bundle-form-title')
    fireEvent.change(titleInput, {target: {value: value.title}})

    const submitButton = screen.getByTestId('create-release-button')
    fireEvent.click(submitButton)

    await expect(useBundleOperations().createBundle).toHaveBeenCalledWith(value)

    expect(usePerspective().setPerspective).toHaveBeenCalledWith(value.name)
    expect(onCreateMock).toHaveBeenCalled()
  })
})
