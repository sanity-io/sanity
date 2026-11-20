import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {
  getVersionFromId,
  type ObjectSchemaType,
  useActiveReleases,
  useAgentVersionDisplay,
  useAllVariants,
  useDocumentVersions,
  usePerspective,
  useReleasesToolAvailable,
  useScheduledDraftsEnabled,
  useSingleDocRelease,
} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {usePerspectiveNavigator} from '../../../../../../hooks/usePerspectiveNavigator'
import {structureUsEnglishLocaleBundle} from '../../../../../../i18n'
import {type DocumentPaneContextValue} from '../../../../DocumentPaneContext'
import {useDocumentPane} from '../../../../useDocumentPane'
import {DocumentPanelNavigation} from '../DocumentPanelNavigation'
import {createPerspective, createRelease, createVariant, createVersion, GROUP_ID} from './fixtures'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useActiveReleases: vi.fn(),
  useAgentVersionDisplay: vi.fn(),
  useAllVariants: vi.fn(),
  useDocumentVersions: vi.fn(),
  usePerspective: vi.fn(),
  useReleasesToolAvailable: vi.fn(),
  useScheduledDraftsEnabled: vi.fn(),
  useSingleDocRelease: vi.fn(),
}))

vi.mock('../../../../useDocumentPane')
vi.mock('../../../../../../hooks/usePerspectiveNavigator')

const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseAgentVersionDisplay = useAgentVersionDisplay as Mock<typeof useAgentVersionDisplay>
const mockUseAllVariants = useAllVariants as Mock<typeof useAllVariants>
const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockUseReleasesToolAvailable = useReleasesToolAvailable as Mock<
  typeof useReleasesToolAvailable
>
const mockUseScheduledDraftsEnabled = useScheduledDraftsEnabled as Mock<
  typeof useScheduledDraftsEnabled
>
const mockUseSingleDocRelease = useSingleDocRelease as Mock<typeof useSingleDocRelease>
const mockUseDocumentPane = useDocumentPane as Mock<() => Partial<DocumentPaneContextValue>>
const mockUsePerspectiveNavigator = usePerspectiveNavigator as Mock<typeof usePerspectiveNavigator>

const OWN_AGENT_BUNDLE = 'agent-mine'

const variantA = createVariant('variantA', 'Variant A')
const releaseA = createRelease('rA', 'Release A')
const scheduledDraft = createRelease('rScheduled', '', {
  cardinality: 'one',
  releaseType: 'scheduled',
  intendedPublishAt: '2026-11-15T12:00:00.000Z',
})
const versions = [
  createVersion({bundle: 'published'}),
  createVersion({bundle: {release: 'rA'}}),
  createVersion({bundle: {release: 'rScheduled'}}),
  createVersion({bundle: {agent: OWN_AGENT_BUNDLE}}),
]

const navigate = vi.fn()

async function renderNavigation(options: {variants: boolean}) {
  const wrapper = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
    config: {
      beta: options.variants
        ? {variants: {enabled: true}}
        : {documentGroupInventory: {enabled: true}},
    },
  })
  render(<DocumentPanelNavigation />, {wrapper})
  return screen.findByTestId('document-panel-navigation-badge-published')
}

function expectInOrder(elements: HTMLElement[]) {
  for (let index = 1; index < elements.length; index++) {
    expect(elements[index - 1].compareDocumentPosition(elements[index])).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  }
}

describe('DocumentPanelNavigation', () => {
  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue({
      documentId: GROUP_ID,
      schemaType: {name: 'article', liveEdit: false} as ObjectSchemaType,
    })
    mockUsePerspective.mockReturnValue(createPerspective())
    mockUsePerspectiveNavigator.mockReturnValue({navigate, setVariant: vi.fn()})
    mockUseReleasesToolAvailable.mockReturnValue(true)
    mockUseScheduledDraftsEnabled.mockReturnValue(true)
    mockUseSingleDocRelease.mockReturnValue({onSetScheduledDraftPerspective: vi.fn()})
    mockUseAllVariants.mockReturnValue({
      data: [variantA],
      byId: new Map([[variantA._id, variantA]]),
      loading: false,
    })
    mockUseDocumentVersions.mockReturnValue({
      data: versions.map((version) => version._id),
      versions,
      loading: false,
    })
    mockUseActiveReleases.mockReturnValue({
      data: [releaseA, scheduledDraft],
      byId: new Map([
        [releaseA._id, releaseA],
        [scheduledDraft._id, scheduledDraft],
      ]),
      loading: false,
      dispatch: vi.fn(),
    })
    mockUseAgentVersionDisplay.mockImplementation((versionIds) => ({
      filteredVersionIds: versionIds.filter((id) => getVersionFromId(id) === OWN_AGENT_BUNDLE),
      getVersionDisplay: (id) =>
        getVersionFromId(id) === OWN_AGENT_BUNDLE
          ? {displayName: 'Proposed changes', tone: 'suggest'}
          : null,
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the variants menu, the Published and Draft badges, the releases and scheduled drafts menus and the agent badge in order', async () => {
    const published = await renderNavigation({variants: true})

    expectInOrder([
      screen.getByTestId('document-variants-menu-button'),
      screen.getByTestId('document-variants-menu-divider'),
      published,
      screen.getByTestId('document-panel-navigation-badge-draft'),
      screen.getByTestId('document-releases-menu-button'),
      screen.getByTestId('document-scheduled-drafts-menu-button'),
      screen.getByTestId('document-panel-navigation-badge-agent'),
    ])
  })

  it('lists releases in the releases menu instead of a badge per release', async () => {
    await renderNavigation({variants: true})

    expect(screen.queryByTestId('document-panel-navigation-badge-release-rA')).toBeNull()
  })

  it('renders the badges and the releases menu without the variants menu with the document group inventory alone', async () => {
    await renderNavigation({variants: false})

    expect(screen.queryByTestId('document-variants-menu-button')).toBeNull()
    expect(screen.queryByTestId('document-variants-menu-divider')).toBeNull()
    expect(screen.getByTestId('document-panel-navigation-badge-draft')).toBeInTheDocument()
    expect(screen.getByTestId('document-releases-menu-button')).toBeInTheDocument()
  })

  it('marks the bundles the selected variant has no version in as inactive', async () => {
    const published = await renderNavigation({variants: true})

    expect(published).toHaveAttribute('data-active')
    expect(screen.getByTestId('document-panel-navigation-badge-draft')).not.toHaveAttribute(
      'data-active',
    )
  })

  it('changes the global perspective when a badge is clicked, inactive ones included', async () => {
    await renderNavigation({variants: true})

    await userEvent.click(screen.getByTestId('document-panel-navigation-badge-draft'))
    expect(navigate).toHaveBeenLastCalledWith('drafts')

    await userEvent.click(screen.getByTestId('document-panel-navigation-badge-published'))
    expect(navigate).toHaveBeenLastCalledWith('published')
  })
})
