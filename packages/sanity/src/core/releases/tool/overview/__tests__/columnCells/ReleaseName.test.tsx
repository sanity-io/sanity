import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {mockUseRouterReturn} from '../../../../../../../test/mocks/useRouter.mock'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {activeASAPRelease, archivedScheduledRelease} from '../../../../__fixtures__/release.fixture'
import {
  mockUsePerspective,
  usePerspectiveMockReturn,
} from '../../../../hooks/__tests__/__mocks__/usePerspective.mock'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {type InjectedTableProps} from '../../../components/Table/types'
import {ReleaseNameCell} from '../../columnCells/ReleaseName'
import {type TableRelease} from '../../ReleasesOverview'

vi.mock('../../../../hooks/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => mockUseRouterReturn,
}))

const renderTest = async (release: TableRelease) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })

  render(<ReleaseNameCell cellProps={{} as InjectedTableProps} datum={release} sorting={false} />, {
    wrapper,
  })

  await waitFor(() => {
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })
}

describe('ReleaseNameCell', () => {
  it('renders the release title correctly', async () => {
    await renderTest(activeASAPRelease)

    expect(screen.getByText('active asap Release')).toBeInTheDocument()
  })

  it('renders the placeholder title for an untitled release', async () => {
    const untitledRelease = {...activeASAPRelease, metadata: {title: ''}} as TableRelease
    await renderTest(untitledRelease)

    expect(screen.getByText('Untitled release')).toBeInTheDocument()
  })

  it('disables the pin button for archived releases', async () => {
    await renderTest(archivedScheduledRelease)

    const pinButton = screen.getByTestId('pin-release-button')
    expect(pinButton).toBeDisabled()
  })

  it('enables the pin button for draft releases', async () => {
    await renderTest(activeASAPRelease)

    const pinButton = screen.getByTestId('pin-release-button')
    expect(pinButton).not.toBeDisabled()
  })

  it('handles pinning a release', async () => {
    await renderTest(activeASAPRelease)

    const pinButton = screen.getByTestId('pin-release-button')
    fireEvent.click(pinButton)

    expect(usePerspectiveMockReturn.setPerspective).toHaveBeenCalledWith('rASAP')
  })

  it('handles unpinning a release', async () => {
    mockUsePerspective.mockReturnValue({...usePerspectiveMockReturn, selectedReleaseId: 'rASAP'})
    await renderTest(activeASAPRelease)

    const pinButton = screen.getByTestId('pin-release-button')
    fireEvent.click(pinButton)

    expect(usePerspectiveMockReturn.setPerspective).toHaveBeenCalledWith('drafts')
  })

  it('navigates to the release detail page on click', async () => {
    await renderTest(activeASAPRelease)

    fireEvent.click(screen.getByText('active asap Release'))

    expect(mockUseRouterReturn.navigate).toHaveBeenCalledWith({releaseId: 'rASAP'})
  })
})
