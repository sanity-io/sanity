import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {act} from 'react'
import {useRouter} from 'sanity/router'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type BundleDocument} from '../../../../store/bundles/types'
import {useBundleOperations} from '../../../../store/bundles/useBundleOperations'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {BundleMenuButton, type BundleMenuButtonProps} from '../BundleMenuButton'

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

const renderTest = async ({bundle, documentCount = 2, disabled = false}: BundleMenuButtonProps) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(
    <BundleMenuButton disabled={disabled} bundle={bundle} documentCount={documentCount} />,
    {wrapper},
  )
}

describe('BundleMenuButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('will archive an unarchived bundle', async () => {
    const activeBundle: BundleDocument = {
      _id: 'activeBundle',
      _type: 'bundle',
      archivedAt: undefined,
      title: 'activeBundle',
      slug: 'activeBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }

    await renderTest({bundle: activeBundle})

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
      slug: 'activeBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({bundle: archivedBundle})

    fireEvent.click(screen.getByLabelText('Release menu'))

    await act(() => {
      fireEvent.click(screen.getByText('Unarchive'))
    })

    expect(useBundleOperations().updateBundle).toHaveBeenCalledWith({
      ...archivedBundle,
      archivedAt: undefined,
    })
  })

  test('will delete a bundle with documents', async () => {
    const activeBundle: BundleDocument = {
      _id: 'activeBundle',
      _type: 'bundle',
      archivedAt: new Date().toISOString(),
      title: 'activeBundle',
      slug: 'activeBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({bundle: activeBundle})

    fireEvent.click(screen.getByLabelText('Release menu'))

    await act(() => {
      fireEvent.click(screen.getByText('Delete'))
    })
    expect(useBundleOperations().deleteBundle).not.toHaveBeenCalled()
    // TODO: remove not exact once i18n used for strings
    screen.getByText('This will also delete 2 document versions', {exact: false})

    await act(() => {
      fireEvent.click(screen.getByText('Delete'))
    })

    expect(useBundleOperations().deleteBundle).toHaveBeenCalledWith(activeBundle)
    expect(useRouter().navigate).not.toHaveBeenCalled()
  })

  test('will delete a bundle with no documents', async () => {
    const activeEmptyBundle: BundleDocument = {
      _id: 'activeEmptyBundle',
      _type: 'bundle',
      archivedAt: new Date().toISOString(),
      title: 'activeEmptyBundle',
      slug: 'activeEmptyBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({bundle: activeEmptyBundle, documentCount: 0})

    fireEvent.click(screen.getByLabelText('Release menu'))

    await act(() => {
      fireEvent.click(screen.getByText('Delete'))
    })
    expect(useBundleOperations().deleteBundle).not.toHaveBeenCalled()
    // confirm dialog body is hidden when no documents in bundle
    expect(screen.queryByTestId('confirm-delete-body')).toBeNull()

    await act(() => {
      fireEvent.click(screen.getByText('Delete'))
    })

    expect(useBundleOperations().deleteBundle).toHaveBeenCalledWith(activeEmptyBundle)
    expect(useRouter().navigate).not.toHaveBeenCalled()
  })

  test('will be disabled', async () => {
    const disabledActionBundle: BundleDocument = {
      _id: 'activeEmptyBundle',
      _type: 'bundle',
      archivedAt: new Date().toISOString(),
      title: 'activeEmptyBundle',
      slug: 'activeEmptyBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({bundle: disabledActionBundle, disabled: true, documentCount: 0})

    fireEvent.click(screen.getByLabelText('Release menu'))
  })
})
