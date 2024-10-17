import {fireEvent, render, screen} from '@testing-library/react'
import {act} from 'react'
import {useRouter} from 'sanity/router'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {type BundleDocument} from '../../../../../store/bundles/types'
import {useBundleOperations} from '../../../../../store/bundles/useBundleOperations'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {ReleaseMenuButton, type ReleaseMenuButtonProps} from '../ReleaseMenuButton'

vi.mock('sanity', () => ({
  SANITY_VERSION: '0.0.0',
  useTranslation: vi.fn().mockReturnValue({t: vi.fn()}),
}))

vi.mock('../../../../../store/bundles/useBundleOperations', () => ({
  useBundleOperations: vi.fn().mockReturnValue({
    deleteBundle: vi.fn(),
    updateBundle: vi.fn(),
  }),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn().mockReturnValue({state: {}, navigate: vi.fn()}),
}))

const renderTest = async ({
  bundle,
  documentCount = 2,
  disabled = false,
}: ReleaseMenuButtonProps) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(
    <ReleaseMenuButton disabled={disabled} bundle={bundle} documentCount={documentCount} />,
    {wrapper},
  )
}

describe.todo('BundleMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('will archive an unarchived bundle', async () => {
    const activeBundle: BundleDocument = {
      _id: 'activeBundle',
      _type: 'release',
      archivedAt: undefined,
      title: 'activeBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }

    await renderTest({bundle: activeBundle})

    fireEvent.click(screen.getByTestId('release-menu-button'))

    await act(() => {
      fireEvent.click(screen.getByTestId('archive-release'))
    })

    expect(useBundleOperations().updateBundle).toHaveBeenCalledWith({
      ...activeBundle,
      archivedAt: expect.any(String),
    })
  })

  test('will unarchive an archived bundle', async () => {
    const archivedBundle: BundleDocument = {
      _id: 'activeBundle',
      _type: 'release',
      archivedAt: new Date().toISOString(),
      title: 'activeBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({bundle: archivedBundle})

    fireEvent.click(screen.getByTestId('release-menu-button'))

    await act(() => {
      fireEvent.click(screen.getByTestId('archive-release'))
    })

    expect(useBundleOperations().updateBundle).toHaveBeenCalledWith({
      ...archivedBundle,
      archivedAt: undefined,
    })
  })

  test('will delete a bundle with documents', async () => {
    const activeBundle: BundleDocument = {
      _id: 'activeBundle',
      _type: 'release',
      archivedAt: new Date().toISOString(),
      title: 'activeBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({bundle: activeBundle})

    fireEvent.click(screen.getByTestId('release-menu-button'))

    await act(() => {
      fireEvent.click(screen.getByTestId('delete-release'))
    })
    expect(useBundleOperations().deleteBundle).not.toHaveBeenCalled()
    expect(screen.getByTestId('confirm-delete-body')).toBeVisible()

    await act(() => {
      fireEvent.click(screen.getByTestId('confirm-button'))
    })

    expect(useBundleOperations().deleteBundle).toHaveBeenCalledWith(activeBundle)
    expect(useRouter().navigate).not.toHaveBeenCalled()
  })

  test('will delete a bundle with no documents', async () => {
    const activeEmptyBundle: BundleDocument = {
      _id: 'activeEmptyBundle',
      _type: 'release',
      archivedAt: new Date().toISOString(),
      title: 'activeEmptyBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({bundle: activeEmptyBundle, documentCount: 0})

    fireEvent.click(screen.getByTestId('release-menu-button'))

    await act(() => {
      fireEvent.click(screen.getByTestId('delete-release'))
    })
    expect(useBundleOperations().deleteBundle).not.toHaveBeenCalled()
    // confirm dialog body is hidden when no documents in bundle
    expect(screen.queryByTestId('confirm-delete-body')).toBeNull()

    await act(() => {
      fireEvent.click(screen.getByTestId('confirm-button'))
    })

    expect(useBundleOperations().deleteBundle).toHaveBeenCalledWith(activeEmptyBundle)
    expect(useRouter().navigate).not.toHaveBeenCalled()
  })

  test('will be disabled', async () => {
    const disabledActionBundle: BundleDocument = {
      _id: 'activeEmptyBundle',
      _type: 'release',
      archivedAt: new Date().toISOString(),
      title: 'activeEmptyBundle',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({bundle: disabledActionBundle, disabled: true, documentCount: 0})

    fireEvent.click(screen.getByTestId('release-menu-button'))
  })
})
