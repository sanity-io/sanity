import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {type BundleDocument, useBundles} from 'sanity'

import {useBundleOperations} from '../../../../store/bundles/useBundleOperations'
import {usePerspective} from '../../../hooks/usePerspective'
import {createWrapper} from '../../../util/tests/createWrapper'
import {CreateBundleDialog} from '../CreateBundleDialog'

/*jest.mock('../../../../../core/hooks/useDateTimeFormat', () => ({
  useDateTimeFormat: jest.fn(),
}))*/

jest.mock('../../../../store/bundles', () => ({
  useBundles: jest.fn(),
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

const mockUseBundleStore = useBundles as jest.Mock<typeof useBundles>
//const mockUseDateTimeFormat = useDateTimeFormat as jest.Mock

describe('CreateBundleDialog', () => {
  const onCancelMock = jest.fn()
  const onCreateMock = jest.fn()

  beforeEach(async () => {
    onCancelMock.mockClear()
    onCreateMock.mockClear()

    mockUseBundleStore.mockReturnValue({
      data: [],
      loading: true,
      dispatch: jest.fn(),
    })

    //mockUseDateTimeFormat.mockReturnValue({format: jest.fn().mockReturnValue('Mocked date')})

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

  it('should call createBundle, setPerspective, and onCreate when form is submitted with a valid slug', async () => {
    const value: Partial<BundleDocument> = {
      slug: 'bundle-1',
      title: 'Bundle 1',
      hue: 'gray',
      icon: 'cube',
      //publishAt: undefined,
    }

    const titleInput = screen.getByTestId('bundle-form-title')
    fireEvent.change(titleInput, {target: {value: value.title}})

    const submitButton = screen.getByTestId('create-release-button')
    fireEvent.click(submitButton)

    await expect(useBundleOperations().createBundle).toHaveBeenCalledWith(value)

    expect(usePerspective().setPerspective).toHaveBeenCalledWith(value.slug)
    expect(onCreateMock).toHaveBeenCalled()
  })
})
