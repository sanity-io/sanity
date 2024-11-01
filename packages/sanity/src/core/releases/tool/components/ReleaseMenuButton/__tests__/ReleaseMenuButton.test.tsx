import {fireEvent, render, screen} from '@testing-library/react'
import {act} from 'react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {type ReleaseDocument} from '../../../../index'
import {useReleaseOperations} from '../../../../store/useReleaseOperations'
import {ReleaseMenuButton, type ReleaseMenuButtonProps} from '../ReleaseMenuButton'

vi.mock('sanity', () => ({
  SANITY_VERSION: '0.0.0',
  useTranslation: vi.fn().mockReturnValue({t: vi.fn()}),
}))

vi.mock('../../../../../store/release/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn().mockReturnValue({
    updateRelease: vi.fn(),
  }),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn().mockReturnValue({state: {}, navigate: vi.fn()}),
}))

const renderTest = async ({release, disabled = false}: ReleaseMenuButtonProps) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(<ReleaseMenuButton disabled={disabled} release={release} />, {wrapper})
}

describe.skip('ReleaseMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('will archive an unarchived release', async () => {
    const activeRelease: ReleaseDocument = {
      _id: 'activeRelease',
      _type: 'release',
      timing: 'immediately',
      archivedAt: undefined,
      title: 'activeRelease',
      createdBy: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }

    await renderTest({release: activeRelease})

    fireEvent.click(screen.getByTestId('release-menu-button'))

    await act(() => {
      fireEvent.click(screen.getByTestId('archive-release'))
    })

    expect(useReleaseOperations().updateRelease).toHaveBeenCalledWith({
      ...activeRelease,
      archivedAt: expect.any(String),
    })
  })

  test('will unarchive an archived release', async () => {
    const archivedRelease: ReleaseDocument = {
      _id: 'activeRelease',
      _type: 'release',
      timing: 'immediately',
      archivedAt: new Date().toISOString(),
      title: 'activeRelease',
      createdBy: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({release: archivedRelease})

    fireEvent.click(screen.getByTestId('release-menu-button'))

    await act(() => {
      fireEvent.click(screen.getByTestId('archive-release'))
    })

    expect(useReleaseOperations().updateRelease).toHaveBeenCalledWith({
      ...archivedRelease,
      archivedAt: undefined,
    })
  })

  test('will be disabled', async () => {
    const disabledActionRelease: ReleaseDocument = {
      _id: 'activeEmptyRelease',
      _type: 'release',
      archivedAt: new Date().toISOString(),
      title: 'activeEmptyRelease',
      timing: 'immediately',
      createdBy: 'author',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '',
      hue: 'gray',
      icon: 'cube',
    }
    await renderTest({release: disabledActionRelease, disabled: true})

    fireEvent.click(screen.getByTestId('release-menu-button'))
  })
})
