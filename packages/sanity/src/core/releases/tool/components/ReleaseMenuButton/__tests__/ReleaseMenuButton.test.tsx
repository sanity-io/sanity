import {fireEvent, render, screen} from '@testing-library/react'
import {act} from 'react'
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
    updateBundle: vi.fn(),
  }),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn().mockReturnValue({state: {}, navigate: vi.fn()}),
}))

const renderTest = async ({bundle, disabled = false}: ReleaseMenuButtonProps) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(<ReleaseMenuButton disabled={disabled} bundle={bundle} />, {wrapper})
}

describe.todo('BundleMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('will archive an unarchived bundle', async () => {
    const activeBundle: BundleDocument = {
      _id: 'activeBundle',
      _type: 'release',
      timing: 'immediately',
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
      timing: 'immediately',
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

  test('will be disabled', async () => {
    const disabledActionBundle: BundleDocument = {
      _id: 'activeEmptyBundle',
      _type: 'release',
      archivedAt: new Date().toISOString(),
      title: 'activeEmptyBundle',
      timing: 'immediately',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({bundle: disabledActionBundle, disabled: true})

    fireEvent.click(screen.getByTestId('release-menu-button'))
  })
})
