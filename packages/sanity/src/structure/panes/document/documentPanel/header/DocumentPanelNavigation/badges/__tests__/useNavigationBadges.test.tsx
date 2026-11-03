import {renderHook} from '@testing-library/react'
import {
  getVersionFromId,
  type ObjectSchemaType,
  useActiveReleases,
  useAgentVersionDisplay,
  useDocumentVersions,
  usePerspective,
  type VersionInfoDocumentStub,
} from 'sanity'
import {afterEach, beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../../test/testUtils/TestProvider'
import {usePerspectiveNavigator} from '../../../../../../../hooks/usePerspectiveNavigator'
import {type DocumentPaneContextValue} from '../../../../../DocumentPaneContext'
import {useDocumentPane} from '../../../../../useDocumentPane'
import {
  createPerspective,
  createRelease,
  createVariant,
  createVersion,
  GROUP_ID,
} from '../../__tests__/fixtures'
import {useNavigationBadges} from '../useNavigationBadges'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useActiveReleases: vi.fn(),
  useAgentVersionDisplay: vi.fn(),
  useDocumentVersions: vi.fn(),
  usePerspective: vi.fn(),
}))

vi.mock('../../../../../useDocumentPane')
vi.mock('../../../../../../../hooks/usePerspectiveNavigator')

const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseAgentVersionDisplay = useAgentVersionDisplay as Mock<typeof useAgentVersionDisplay>
const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockUseDocumentPane = useDocumentPane as Mock<() => Partial<DocumentPaneContextValue>>
const mockUsePerspectiveNavigator = usePerspectiveNavigator as Mock<typeof usePerspectiveNavigator>

const OWN_AGENT_BUNDLE = 'agent-mine'

const variantA = createVariant('variantA', 'Variant A')
const releaseA = createRelease('rA', 'Release A')
const releaseB = createRelease('rB', 'Release B')
const releaseC = createRelease('rC', 'Release C')

const versions = [
  createVersion({bundle: 'published'}),
  createVersion({bundle: 'drafts'}),
  createVersion({bundle: {release: 'rA'}}),
  createVersion({bundle: {release: 'rC'}}),
  createVersion({bundle: 'published', variant: 'variantA'}),
  createVersion({bundle: {release: 'rA'}, variant: 'variantA'}),
  createVersion({bundle: {release: 'rB'}, variant: 'variantA'}),
  createVersion({bundle: {release: 'rB'}, variant: 'variantB'}),
]

const navigate = vi.fn()
let wrapper: React.ComponentType<{children: React.ReactNode}>

function mockVersions(documentVersions: VersionInfoDocumentStub[]) {
  mockUseDocumentVersions.mockReturnValue({
    data: documentVersions.map((version) => version._id),
    versions: documentVersions,
    loading: false,
  })
}

function mockSchemaType(liveEdit: boolean) {
  mockUseDocumentPane.mockReturnValue({
    documentId: GROUP_ID,
    schemaType: {name: 'article', liveEdit} as ObjectSchemaType,
  })
}

function releaseIds(result: ReturnType<typeof useNavigationBadges>) {
  return result.releases.map(({release}) => release.name)
}

beforeAll(async () => {
  wrapper = await createTestProvider()
})

describe('useNavigationBadges', () => {
  beforeEach(() => {
    mockSchemaType(false)
    mockVersions(versions)
    mockUsePerspective.mockReturnValue(createPerspective())
    mockUsePerspectiveNavigator.mockReturnValue({navigate})
    const activeReleases = [releaseA, releaseB, releaseC]
    mockUseActiveReleases.mockReturnValue({
      data: activeReleases,
      byId: new Map(activeReleases.map((release) => [release._id, release])),
      loading: false,
      dispatch: vi.fn(),
    })
    // Only the current user's agent bundle survives, the way `useAgentVersionDisplay` filters.
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

  it('shows the bundles outside any variant when no variant is selected', () => {
    const {result} = renderHook(() => useNavigationBadges(), {wrapper})

    expect(result.current.published.active).toBe(true)
    expect(result.current.draft?.active).toBe(true)
    expect(releaseIds(result.current)).toEqual(['rA', 'rC'])
  })

  it('shows the bundles of the selected variant', () => {
    mockUsePerspective.mockReturnValue(createPerspective({selectedVariants: [variantA]}))

    const {result} = renderHook(() => useNavigationBadges(), {wrapper})

    expect(result.current.published.active).toBe(true)
    expect(result.current.draft?.active).toBe(false)
    expect(releaseIds(result.current)).toEqual(['rA', 'rB'])
  })

  it('selects the badge of the global perspective, also while a variant is selected', () => {
    mockUsePerspective.mockReturnValue(
      createPerspective({selectedPerspectiveName: 'published', selectedVariants: [variantA]}),
    )
    const {result, rerender} = renderHook(() => useNavigationBadges(), {wrapper})

    expect(result.current.published.selected).toBe(true)
    expect(result.current.draft?.selected).toBe(false)

    mockUsePerspective.mockReturnValue(createPerspective({selectedVariants: [variantA]}))
    rerender()

    expect(result.current.published.selected).toBe(false)
    expect(result.current.draft?.selected).toBe(true)

    mockUsePerspective.mockReturnValue(
      createPerspective({
        selectedPerspectiveName: 'rB',
        selectedReleaseId: 'rB',
        selectedVariants: [variantA],
      }),
    )
    rerender()

    expect(result.current.draft?.selected).toBe(false)
    expect(result.current.releases.map(({release, selected}) => [release.name, selected])).toEqual([
      ['rA', false],
      ['rB', true],
    ])
  })

  it('selects Published for a live-edit document in the drafts perspective', () => {
    mockSchemaType(true)

    const {result} = renderHook(() => useNavigationBadges(), {wrapper})

    expect(result.current.published.selected).toBe(true)
    expect(result.current.draft?.selected).toBe(false)
  })

  it('shows the own agent bundle only in the variant it has a version in', () => {
    mockVersions([
      ...versions,
      createVersion({bundle: {agent: OWN_AGENT_BUNDLE}, variant: 'variantA'}),
      createVersion({bundle: {agent: 'agent-someone-else'}}),
    ])
    const {result, rerender} = renderHook(() => useNavigationBadges(), {wrapper})

    expect(result.current.agent).toBeUndefined()

    mockUsePerspective.mockReturnValue(createPerspective({selectedVariants: [variantA]}))
    rerender()

    expect(result.current.agent).toEqual({
      bundleId: OWN_AGENT_BUNDLE,
      display: {displayName: 'Proposed changes', tone: 'suggest'},
      selected: false,
    })
  })

  it('navigates through the pane perspective navigator', () => {
    const {result} = renderHook(() => useNavigationBadges(), {wrapper})

    result.current.navigate('published')

    expect(navigate).toHaveBeenCalledWith('published')
  })
})
