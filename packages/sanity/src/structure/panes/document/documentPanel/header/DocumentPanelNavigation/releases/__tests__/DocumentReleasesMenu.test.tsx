import {type ReleaseDocument} from '@sanity/client'
import {render, screen, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {
  type SingleWorkspace,
  useActiveReleases,
  useDocumentVersions,
  usePerspective,
  useReleasesToolAvailable,
  type VersionInfoDocumentStub,
} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../../test/testUtils/TestProvider'
import {usePerspectiveNavigator} from '../../../../../../../hooks/usePerspectiveNavigator'
import {structureUsEnglishLocaleBundle} from '../../../../../../../i18n'
import {type DocumentPaneContextValue} from '../../../../../DocumentPaneContext'
import {useDocumentPane} from '../../../../../useDocumentPane'
import {
  createPerspective,
  createRelease,
  createVariant,
  createVersion,
  GROUP_ID,
} from '../../__tests__/fixtures'
import {DocumentReleasesMenu} from '../DocumentReleasesMenu'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useActiveReleases: vi.fn(),
  useDocumentVersions: vi.fn(),
  usePerspective: vi.fn(),
  useReleasesToolAvailable: vi.fn(),
}))

vi.mock('../../../../../useDocumentPane')
vi.mock('../../../../../../../hooks/usePerspectiveNavigator')

const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockUseReleasesToolAvailable = useReleasesToolAvailable as Mock<
  typeof useReleasesToolAvailable
>
const mockUseDocumentPane = useDocumentPane as Mock<() => Partial<DocumentPaneContextValue>>
const mockUsePerspectiveNavigator = usePerspectiveNavigator as Mock<typeof usePerspectiveNavigator>

const variantA = createVariant('variantA', 'Variant A')
const releaseA = createRelease('rA', 'Release A')
const releaseB = createRelease('rB', 'Release B')
const halloween = createRelease('rHalloween', 'Halloween', {
  releaseType: 'scheduled',
  intendedPublishAt: '2026-10-31T10:00:00.000Z',
})
const scheduledDraft = createRelease('rScheduledDraft', 'Scheduled draft', {cardinality: 'one'})

const navigate = vi.fn()

function mockReleases(releases: ReleaseDocument[]) {
  mockUseActiveReleases.mockReturnValue({
    data: releases,
    byId: new Map(releases.map((release) => [release._id, release])),
    loading: false,
    dispatch: vi.fn(),
  })
}

function mockVersions(versions: VersionInfoDocumentStub[]) {
  mockUseDocumentVersions.mockReturnValue({
    data: versions.map((version) => version._id),
    versions,
    loading: false,
  })
}

async function renderMenu(config?: Partial<SingleWorkspace>) {
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle], config})
  render(
    <>
      <span data-testid="rendered" />
      <DocumentReleasesMenu />
    </>,
    {wrapper},
  )
  // The locale provider suspends on the first render.
  await screen.findByTestId('rendered')
}

async function openMenu() {
  await userEvent.click(screen.getByTestId('document-releases-menu-button'))
  return screen.findByTestId('document-releases-menu')
}

describe('DocumentReleasesMenu', () => {
  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue({documentId: GROUP_ID})
    mockUsePerspective.mockReturnValue(createPerspective())
    mockUsePerspectiveNavigator.mockReturnValue({navigate})
    mockUseReleasesToolAvailable.mockReturnValue(true)
    mockReleases([releaseA, releaseB, halloween, scheduledDraft])
    mockVersions([
      createVersion({bundle: 'published'}),
      createVersion({bundle: {release: 'rA'}}),
      createVersion({bundle: {release: 'rB'}, variant: 'variantA'}),
    ])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when releases are disabled in the workspace', async () => {
    await renderMenu({releases: {enabled: false}})

    expect(screen.queryByTestId('document-releases-menu-button')).toBeNull()
  })

  it('renders nothing when the releases tool is not available', async () => {
    mockUseReleasesToolAvailable.mockReturnValue(false)
    await renderMenu()

    expect(screen.queryByTestId('document-releases-menu-button')).toBeNull()
  })

  it('renders nothing when the only active releases are scheduled drafts', async () => {
    mockReleases([scheduledDraft])
    await renderMenu()

    expect(screen.queryByTestId('document-releases-menu-button')).toBeNull()
  })

  it('labels the trigger "Releases" outside a release perspective', async () => {
    await renderMenu()

    expect(screen.getByTestId('document-releases-menu-button')).toHaveTextContent('Releases')
    expect(screen.queryByTestId('dropdown-button-clear')).toBeNull()
  })

  it('names the selected release on the trigger and clears it to the default perspective', async () => {
    mockUsePerspective.mockReturnValue(
      createPerspective({
        selectedPerspective: releaseB,
        selectedPerspectiveName: 'rB',
        selectedReleaseId: 'rB',
      }),
    )
    await renderMenu()

    expect(screen.getByTestId('document-releases-menu-button')).toHaveTextContent('Release B')

    await userEvent.click(screen.getByTestId('dropdown-button-clear'))

    expect(navigate).toHaveBeenCalledWith('drafts')
  })

  it('lists the releases the document is in apart from the others, leaving out scheduled drafts', async () => {
    await renderMenu()

    const menu = await openMenu()

    const documentSection = within(menu).getByTestId('document-releases-menu-section-document')
    expect(documentSection).toHaveTextContent('In 1 release')
    expect(within(documentSection).getByTestId('document-release-rA')).toBeInTheDocument()

    const otherSection = within(menu).getByTestId('document-releases-menu-section-other')
    expect(otherSection).toHaveTextContent('Other releases')
    expect(within(otherSection).getByTestId('document-release-rB')).toBeInTheDocument()
    expect(within(otherSection).getByTestId('document-release-rHalloween').textContent).toMatch(
      /^Halloween · .+/,
    )
    expect(within(menu).queryByTestId('document-release-rScheduledDraft')).toBeNull()
  })

  it('follows the selected variant for the releases the document is in', async () => {
    mockUsePerspective.mockReturnValue(createPerspective({selectedVariants: [variantA]}))
    await renderMenu()

    const menu = await openMenu()

    const documentSection = within(menu).getByTestId('document-releases-menu-section-document')
    expect(within(documentSection).getByTestId('document-release-rB')).toBeInTheDocument()
    expect(within(documentSection).queryByTestId('document-release-rA')).toBeNull()
  })

  it('shows an empty "In 0 releases" section with a tooltip when the document is in none', async () => {
    mockVersions([createVersion({bundle: 'published'})])
    await renderMenu()

    const menu = await openMenu()

    const documentSection = within(menu).getByTestId('document-releases-menu-section-document')
    expect(documentSection).toHaveTextContent('In 0 releases')
    expect(
      within(documentSection).getByTestId('document-releases-menu-section-document-tooltip'),
    ).toHaveAccessibleName("This document isn't in any release yet. Pick one below to add it.")
  })

  it('changes the global perspective to the release picked', async () => {
    await renderMenu()

    const menu = await openMenu()
    await userEvent.click(within(menu).getByTestId('document-release-rB'))

    expect(navigate).toHaveBeenCalledWith(releaseB)
  })

  it('filters the releases by title and says when nothing matches', async () => {
    await renderMenu()

    const menu = await openMenu()
    const input = within(menu).getByPlaceholderText('Find')

    await userEvent.type(input, 'hallo')
    expect(within(menu).getByTestId('document-release-rHalloween')).toBeInTheDocument()
    expect(within(menu).queryByTestId('document-release-rA')).toBeNull()
    expect(within(menu).queryByTestId('document-releases-menu-section-document')).toBeNull()

    await userEvent.clear(input)
    await userEvent.type(input, 'zzz')
    expect(within(menu).getByTestId('document-releases-menu-no-matches')).toHaveTextContent(
      'Nothing matches "zzz"',
    )
  })
})
