import {fireEvent, render, screen} from '@testing-library/react'
import {act} from 'react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {type BundleDocument} from '../../../../../store'
import {useReleaseOperations} from '../../../../../store/release/useReleaseOperations'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {ReleaseMenuButton, type ReleaseMenuButtonProps} from '../ReleaseMenuButton'

vi.mock('sanity', () => ({
  SANITY_VERSION: '0.0.0',
  useTranslation: vi.fn().mockReturnValue({t: vi.fn()}),
}))

vi.mock('../../../../../store/release/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn().mockReturnValue({
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

describe.skip('ReleaseMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('will archive an unarchived release', async () => {
    const activeRelease: BundleDocument = {
      _id: 'activeRelease',
      _type: 'release',
      timing: 'immediately',
      archivedAt: undefined,
      title: 'activeRelease',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }

    await renderTest({bundle: activeRelease})

    fireEvent.click(screen.getByTestId('release-menu-button'))

    await act(() => {
      fireEvent.click(screen.getByTestId('archive-release'))
    })

    expect(useReleaseOperations().updateBundle).toHaveBeenCalledWith({
      ...activeRelease,
      archivedAt: expect.any(String),
    })
  })

  test('will unarchive an archived release', async () => {
    const archivedRelease: BundleDocument = {
      _id: 'activeRelease',
      _type: 'release',
      timing: 'immediately',
      archivedAt: new Date().toISOString(),
      title: 'activeRelease',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({bundle: archivedRelease})

    fireEvent.click(screen.getByTestId('release-menu-button'))

    await act(() => {
      fireEvent.click(screen.getByTestId('archive-release'))
    })

    expect(useReleaseOperations().updateBundle).toHaveBeenCalledWith({
      ...archivedRelease,
      archivedAt: undefined,
    })
  })

  test('will be disabled', async () => {
    const disabledActionRelease: BundleDocument = {
      _id: 'activeEmptyRelease',
      _type: 'release',
      archivedAt: new Date().toISOString(),
      title: 'activeEmptyRelease',
      timing: 'immediately',
      authorId: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({bundle: disabledActionRelease, disabled: true})

    fireEvent.click(screen.getByTestId('release-menu-button'))
  })
})
