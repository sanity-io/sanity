import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {
  type ObjectSchemaType,
  useActiveReleases,
  useAgentVersionDisplay,
  useAllVariants,
  useDocumentVersions,
  usePerspective,
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
}))

vi.mock('../../../../useDocumentPane')
vi.mock('../../../../../../hooks/usePerspectiveNavigator')

const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseAgentVersionDisplay = useAgentVersionDisplay as Mock<typeof useAgentVersionDisplay>
const mockUseAllVariants = useAllVariants as Mock<typeof useAllVariants>
const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockUseDocumentPane = useDocumentPane as Mock<() => Partial<DocumentPaneContextValue>>
const mockUsePerspectiveNavigator = usePerspectiveNavigator as Mock<typeof usePerspectiveNavigator>

const variantA = createVariant('variantA', 'Variant A')
const releaseA = createRelease('rA', 'Release A')
const versions = [createVersion({bundle: 'published'}), createVersion({bundle: {release: 'rA'}})]

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

describe('DocumentPanelNavigation', () => {
  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue({
      documentId: GROUP_ID,
      schemaType: {name: 'article', liveEdit: false} as ObjectSchemaType,
    })
    mockUsePerspective.mockReturnValue(createPerspective())
    mockUsePerspectiveNavigator.mockReturnValue({navigate})
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
      data: [releaseA],
      byId: new Map([[releaseA._id, releaseA]]),
      loading: false,
      dispatch: vi.fn(),
    })
    mockUseAgentVersionDisplay.mockReturnValue({
      filteredVersionIds: [],
      getVersionDisplay: () => null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('puts the variants menu and its divider before the badges when variants are enabled', async () => {
    const published = await renderNavigation({variants: true})

    const menuButton = screen.getByTestId('document-variants-menu-button')
    const divider = screen.getByTestId('document-variants-menu-divider')
    expect(menuButton.compareDocumentPosition(divider)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(divider.compareDocumentPosition(published)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('renders only the badges with the document group inventory alone', async () => {
    await renderNavigation({variants: false})

    expect(screen.queryByTestId('document-variants-menu-button')).toBeNull()
    expect(screen.queryByTestId('document-variants-menu-divider')).toBeNull()
    expect(screen.getByTestId('document-panel-navigation-badge-draft')).toBeInTheDocument()
    expect(screen.getByTestId('document-panel-navigation-badge-release-rA')).toBeInTheDocument()
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

    await userEvent.click(screen.getByTestId('document-panel-navigation-badge-release-rA'))
    expect(navigate).toHaveBeenLastCalledWith(releaseA)

    await userEvent.click(screen.getByTestId('document-panel-navigation-badge-draft'))
    expect(navigate).toHaveBeenLastCalledWith('drafts')

    await userEvent.click(screen.getByTestId('document-panel-navigation-badge-published'))
    expect(navigate).toHaveBeenLastCalledWith('published')
  })
})
