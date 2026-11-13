import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {mockUseRouterReturn} from '../../../../../../../test/mocks/useRouter.mock'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {
  mockUsePerspective,
  usePerspectiveMockReturn,
} from '../../../../../perspective/__mocks__/usePerspective.mock'
import {activeASAPRelease, archivedScheduledRelease} from '../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {type InjectedTableProps} from '../../../components/Table/types'
import {ReleaseNameCell} from '../../columnCells/ReleaseName'
import {type TableRelease} from '../../ReleasesOverview'

vi.mock('../../../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

const mockedSetPerspective = vi.fn()
vi.mock('../../../../../perspective/useSetPerspective', () => ({
  useSetPerspective: vi.fn(() => mockedSetPerspective),
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
    await userEvent.click(pinButton)

    expect(mockedSetPerspective).toHaveBeenCalledWith('rASAP')
  })

  it('handles unpinning a release', async () => {
    mockUsePerspective.mockReturnValue({...usePerspectiveMockReturn, selectedReleaseId: 'rASAP'})
    await renderTest(activeASAPRelease)

    const pinButton = screen.getByTestId('pin-release-button')
    await userEvent.click(pinButton)

    expect(mockedSetPerspective).toHaveBeenCalledWith('drafts')
  })

  it('links the release title to its detail page', async () => {
    mockUseRouterReturn.resolvePathFromState.mockReturnValue('/releases/rASAP')
    await renderTest(activeASAPRelease)

    const link = screen.getByRole('link', {name: 'active asap Release'})
    expect(link).toHaveAttribute('href', '/releases/rASAP')
  })

  it('navigates to the release detail page on click', async () => {
    mockUseRouterReturn.resolvePathFromState.mockReturnValue('/releases/rASAP')
    await renderTest(activeASAPRelease)

    await userEvent.click(screen.getByRole('link', {name: 'active asap Release'}))

    expect(mockUseRouterReturn.navigate).toHaveBeenCalledWith({releaseId: 'rASAP'})
  })

  it.each([
    ['command-click', {metaKey: true}],
    ['ctrl-click', {ctrlKey: true}],
    ['shift-click', {shiftKey: true}],
    ['middle-click', {button: 1}],
  ])('leaves a %s to the browser so the release can open in a new tab', async (_, init) => {
    mockUseRouterReturn.resolvePathFromState.mockReturnValue('/releases/rASAP')
    await renderTest(activeASAPRelease)

    const link = screen.getByRole('link', {name: 'active asap Release'})
    let followedLink: boolean | undefined
    // Runs after React's handler. jsdom can't navigate, so stop the link here.
    const stopNavigation = (event: Event) => {
      followedLink = !event.defaultPrevented
      event.preventDefault()
    }
    document.addEventListener('click', stopNavigation)
    // oxlint-disable-next-line testing-library/prefer-user-event -- sets the modifier and button on a single click without userEvent's pointer sequence
    fireEvent.click(link, init)
    document.removeEventListener('click', stopNavigation)

    expect(followedLink).toBe(true)
    expect(mockUseRouterReturn.navigate).not.toHaveBeenCalled()
    expect(link).toHaveAttribute('href', '/releases/rASAP')
  })

  it('does not link a deleted release', async () => {
    await renderTest({...activeASAPRelease, isDeleted: true})

    expect(screen.getAllByText('active asap Release').length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', {name: 'active asap Release'})).not.toBeInTheDocument()
  })
})
