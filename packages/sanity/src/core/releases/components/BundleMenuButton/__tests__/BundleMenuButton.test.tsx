import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {act} from 'react'
import {useRouter} from 'sanity/router'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type BundleDocument} from '../../../../store/bundles/types'
import {useBundleOperations} from '../../../../store/bundles/useBundleOperations'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {BundleMenuButton} from '../BundleMenuButton'

jest.mock('../../../../store/bundles/useBundleOperations', () => ({
  useBundleOperations: jest.fn().mockReturnValue({
    deleteBundle: jest.fn(),
    updateBundle: jest.fn(),
  }),
}))

jest.mock('sanity/router', () => ({
  ...(jest.requireActual('sanity/router') || {}),
  useRouter: jest.fn().mockReturnValue({state: {}, navigate: jest.fn()}),
}))

const renderTest = async (bundle: BundleDocument) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(<BundleMenuButton bundle={bundle} />, {wrapper})
}

describe('BundleMenuButton', () => {
  test('will archive an unarchived bundle', async () => {
    const activeBundle: BundleDocument = {
      _id: 'activeBundle',
      _type: 'bundle',
      archivedAt: undefined,
      title: 'activeBundle',
      name: 'activeBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
    }

    await renderTest(activeBundle)

    fireEvent.click(screen.getByLabelText('Release menu'))

    await act(() => {
      fireEvent.click(screen.getByText('Archive'))
    })

    expect(useBundleOperations().updateBundle).toHaveBeenCalledWith({
      ...activeBundle,
      archivedAt: expect.any(String),
    })
  })

  test('will unarchive an archived bundle', async () => {
    const archivedBundle: BundleDocument = {
      _id: 'activeBundle',
      _type: 'bundle',
      archivedAt: new Date().toISOString(),
      title: 'activeBundle',
      name: 'activeBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
    }
    await renderTest(archivedBundle)

    fireEvent.click(screen.getByLabelText('Release menu'))

    await act(() => {
      fireEvent.click(screen.getByText('Unarchive'))
    })

    expect(useBundleOperations().updateBundle).toHaveBeenCalledWith({
      ...archivedBundle,
      archivedAt: undefined,
    })
  })

  test('will delete a bundle', async () => {
    const activeBundle: BundleDocument = {
      _id: 'activeBundle',
      _type: 'bundle',
      archivedAt: new Date().toISOString(),
      title: 'activeBundle',
      name: 'activeBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
    }
    await renderTest(activeBundle)

    fireEvent.click(screen.getByLabelText('Release menu'))

    await act(() => {
      fireEvent.click(screen.getByText('Delete'))
    })
    expect(useBundleOperations().deleteBundle).not.toHaveBeenCalled()

    await act(() => {
      fireEvent.click(screen.getByText('Confirm'))
    })

    expect(useBundleOperations().deleteBundle).toHaveBeenCalledWith(activeBundle)
    expect(useRouter().navigate).not.toHaveBeenCalled()
  })
})
