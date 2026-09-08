import {type ReleaseDocument} from '@sanity/client'
import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {activeScheduledRelease} from '../releases/__fixtures__/release.fixture'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {type AgentBundlesState} from '../store/agent/createAgentBundlesStore'
import {useAgentBundles} from '../store/agent/useAgentBundles'
import {useWorkspace} from '../studio/workspace'
import type * as WorkspaceModule from '../studio/workspace'
import {variantAlphaAudience} from '../variants/__fixtures__/variants.fixture'
import {useAllVariants} from '../variants/store/useAllVariants'
import {type SystemVariant} from '../variants/types'
import {useDocumentVersionTitle} from './useDocumentVersionTitle'

vi.mock('../studio/workspace', async (importOriginal) => {
  const actual = await importOriginal<typeof WorkspaceModule>()
  return {
    ...actual,
    useWorkspace: vi.fn(() => ({})),
  }
})

vi.mock('../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => ({
    data: [],
    byId: new Map(),
    error: undefined,
    loading: false,
    dispatch: vi.fn(),
  })),
}))

vi.mock('../variants/store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => ({
    data: [],
    byId: new Map(),
    loading: false,
    error: undefined,
  })),
}))

vi.mock('../store/agent/useAgentBundles', () => ({
  useAgentBundles: vi.fn(() => ({bundles: [], loading: false})),
}))

const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseAllVariants = useAllVariants as Mock<typeof useAllVariants>
const mockUseAgentBundles = useAgentBundles as Mock<typeof useAgentBundles>
const mockUseWorkspace = useWorkspace as Mock<typeof useWorkspace>

const GROUP_ID = 'article-1'
const OWN_AGENT_BUNDLE = 'agent-mine1'
const OTHER_AGENT_BUNDLE = 'agent-other1'

type VariantsStoreState = ReturnType<typeof useAllVariants>
type ReleasesStoreState = ReturnType<typeof useActiveReleases>

const defaultStores = {
  variants: {
    data: [] as SystemVariant[],
    byId: new Map<string, SystemVariant>(),
    loading: false,
    error: undefined as Error | undefined,
  } satisfies VariantsStoreState,
  releases: {
    data: [] as ReleaseDocument[],
    byId: new Map<string, ReleaseDocument>(),
    loading: false,
    error: undefined as Error | undefined,
    dispatch: vi.fn(),
  } satisfies ReleasesStoreState,
  agentBundles: {
    bundles: [],
    loading: false,
  } satisfies AgentBundlesState,
}

function createVersion({
  id,
  bundleId,
  variantRef,
  releaseRef,
}: {
  id: string
  bundleId?: string
  variantRef?: string
  releaseRef?: string
}): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-02T00:00:00.000Z',
    _system: {
      bundleId,
      group: {_ref: GROUP_ID, _weak: true},
      ...(variantRef ? {variant: {_ref: variantRef, _weak: true}} : {}),
      ...(releaseRef ? {release: {_ref: releaseRef, _weak: true}} : {}),
    },
  }
}

function setVariantsEnabled(enabled: boolean | undefined) {
  if (enabled === true) {
    mockUseWorkspace.mockReturnValue({beta: {variants: {enabled: true}}} as ReturnType<
      typeof useWorkspace
    >)
    return
  }

  if (enabled === false) {
    mockUseWorkspace.mockReturnValue({beta: {variants: {enabled: false}}} as ReturnType<
      typeof useWorkspace
    >)
    return
  }

  mockUseWorkspace.mockReturnValue({} as ReturnType<typeof useWorkspace>)
}

async function renderTitle({
  version,
  variantsEnabled,
  workspace,
  stores = {},
}: {
  version: VersionInfoDocumentStub
  variantsEnabled?: boolean
  workspace?: ReturnType<typeof useWorkspace>
  stores?: {
    variants?: Partial<VariantsStoreState>
    releases?: Partial<ReleasesStoreState>
    agentBundles?: Partial<AgentBundlesState>
  }
}) {
  mockUseAllVariants.mockReturnValue({
    ...defaultStores.variants,
    ...stores.variants,
  } satisfies VariantsStoreState)
  mockUseActiveReleases.mockReturnValue({
    ...defaultStores.releases,
    ...stores.releases,
  } satisfies ReleasesStoreState)
  mockUseAgentBundles.mockReturnValue({
    ...defaultStores.agentBundles,
    ...stores.agentBundles,
  } satisfies AgentBundlesState)
  if (workspace) {
    mockUseWorkspace.mockReturnValue(workspace)
  } else {
    setVariantsEnabled(variantsEnabled)
  }

  const wrapper = await createTestProvider()

  return renderHook(() => useDocumentVersionTitle({version}), {wrapper})
}

describe('useDocumentVersionTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVariantsEnabled(undefined)
  })

  describe('loading and error states', () => {
    it('returns loading copy while variants are loading', async () => {
      const {result} = await renderTitle({
        version: createVersion({id: GROUP_ID}),
        stores: {variants: {loading: true}},
      })

      expect(result.current).toEqual({
        title: 'Loading',
        fullTitle: 'Loading',
        isTruncated: false,
      })
    })

    it('returns loading copy while releases are loading', async () => {
      const {result} = await renderTitle({
        version: createVersion({id: GROUP_ID}),
        stores: {releases: {loading: true}},
      })

      expect(result.current).toEqual({
        title: 'Loading',
        fullTitle: 'Loading',
        isTruncated: false,
      })
    })

    it('returns loading copy when both variants and releases are loading', async () => {
      const {result} = await renderTitle({
        version: createVersion({id: GROUP_ID}),
        stores: {variants: {loading: true}, releases: {loading: true}},
      })

      expect(result.current.title).toBe('Loading')
    })

    it('returns error copy when variants fail to load', async () => {
      const {result} = await renderTitle({
        version: createVersion({id: GROUP_ID}),
        stores: {variants: {error: new Error('variants failed')}},
      })

      expect(result.current).toEqual({
        title: 'Error',
        fullTitle: 'Error',
        isTruncated: false,
      })
    })

    it('returns error copy when releases fail to load', async () => {
      const {result} = await renderTitle({
        version: createVersion({id: GROUP_ID}),
        stores: {releases: {error: new Error('releases failed')}},
      })

      expect(result.current).toEqual({
        title: 'Error',
        fullTitle: 'Error',
        isTruncated: false,
      })
    })

    it('returns error copy when both variants and releases fail to load', async () => {
      const {result} = await renderTitle({
        version: createVersion({id: GROUP_ID}),
        stores: {
          variants: {error: new Error('variants failed')},
          releases: {error: new Error('releases failed')},
        },
      })

      expect(result.current.title).toBe('Error')
    })
  })

  describe('variants disabled', () => {
    it('uses only the published perspective label', async () => {
      const {result} = await renderTitle({version: createVersion({id: GROUP_ID})})

      expect(result.current).toEqual({
        title: 'Published',
        fullTitle: 'Published',
        isTruncated: false,
      })
    })

    it('uses only the draft perspective label', async () => {
      const {result} = await renderTitle({
        version: createVersion({id: `drafts.${GROUP_ID}`, bundleId: 'drafts'}),
      })

      expect(result.current).toEqual({
        title: 'Draft',
        fullTitle: 'Draft',
        isTruncated: false,
      })
    })
  })

  describe('variants enabled', () => {
    it('prefixes the default variant title for published and draft versions', async () => {
      const {result: published} = await renderTitle({
        version: createVersion({id: GROUP_ID}),
        variantsEnabled: true,
      })
      const {result: draft} = await renderTitle({
        version: createVersion({id: `drafts.${GROUP_ID}`, bundleId: 'drafts'}),
        variantsEnabled: true,
      })

      expect(published.current.title).toBe('All users (Default) · Published')
      expect(draft.current.title).toBe('All users (Default) · Draft')
    })

    it('uses the named variant title when the variant exists', async () => {
      const {result} = await renderTitle({
        version: createVersion({
          id: `published.alpha.${GROUP_ID}`,
          variantRef: variantAlphaAudience._id,
        }),
        variantsEnabled: true,
        stores: {
          variants: {
            data: [variantAlphaAudience],
            byId: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
          },
        },
      })

      expect(result.current.title).toBe('Alpha audience · Published')
      expect(result.current.fullTitle).toBe('Alpha audience · Published')
    })

    it('falls back to the base variant title when the variant ref is missing from the store', async () => {
      const {result} = await renderTitle({
        version: createVersion({
          id: `published.alpha.${GROUP_ID}`,
          variantRef: variantAlphaAudience._id,
        }),
        variantsEnabled: true,
      })

      expect(result.current.title).toBe('All users (Default) · Published')
    })

    it('ignores variant and release entries without a ref', async () => {
      const version: VersionInfoDocumentStub = {
        ...createVersion({id: GROUP_ID}),
        _system: {
          group: {_ref: GROUP_ID, _weak: true},
          variant: {_weak: true},
          release: {_weak: true},
        } as VersionInfoDocumentStub['_system'],
      }

      const {result} = await renderTitle({version, variantsEnabled: true})

      expect(result.current.title).toBe('All users (Default) · Published')
    })

    it('uses only the release title when the workspace has variants disabled explicitly', async () => {
      const {result} = await renderTitle({
        version: createVersion({id: GROUP_ID}),
        variantsEnabled: false,
      })

      expect(result.current.title).toBe('Published')
    })

    it('uses only the release title when the workspace beta config has no variants section', async () => {
      const {result} = await renderTitle({
        version: createVersion({id: GROUP_ID}),
        workspace: {beta: {}} as ReturnType<typeof useWorkspace>,
      })

      expect(result.current.title).toBe('Published')
    })

    it('uses only the release title when variants are configured without an enabled flag', async () => {
      const {result} = await renderTitle({
        version: createVersion({id: GROUP_ID}),
        workspace: {beta: {variants: {}}} as ReturnType<typeof useWorkspace>,
      })

      expect(result.current.title).toBe('Published')
    })
  })

  describe('release perspectives', () => {
    it('uses the release document title when the release is known', async () => {
      const {result} = await renderTitle({
        version: createVersion({
          id: `versions.${activeScheduledRelease.name}.${GROUP_ID}`,
          bundleId: activeScheduledRelease.name,
          releaseRef: activeScheduledRelease._id,
        }),
        stores: {
          releases: {
            data: [activeScheduledRelease],
            byId: new Map([[activeScheduledRelease._id, activeScheduledRelease]]),
          },
        },
      })

      expect(result.current).toEqual({
        title: 'active Release',
        fullTitle: 'active Release',
        isTruncated: false,
      })
    })

    it('uses the untitled release placeholder when the release has no title', async () => {
      const untitledRelease: ReleaseDocument = {
        ...activeScheduledRelease,
        metadata: {...activeScheduledRelease.metadata, title: undefined},
      }

      const {result} = await renderTitle({
        version: createVersion({
          id: `versions.${untitledRelease.name}.${GROUP_ID}`,
          bundleId: untitledRelease.name,
          releaseRef: untitledRelease._id,
        }),
        stores: {
          releases: {
            data: [untitledRelease],
            byId: new Map([[untitledRelease._id, untitledRelease]]),
          },
        },
      })

      expect(result.current.title).toBe('Untitled release')
    })

    it('truncates long release titles in the display title but keeps the full title', async () => {
      const longTitle = 'A'.repeat(60)
      const longTitleRelease: ReleaseDocument = {
        ...activeScheduledRelease,
        metadata: {...activeScheduledRelease.metadata, title: longTitle},
      }

      const {result} = await renderTitle({
        version: createVersion({
          id: `versions.${longTitleRelease.name}.${GROUP_ID}`,
          bundleId: longTitleRelease.name,
          releaseRef: longTitleRelease._id,
        }),
        variantsEnabled: true,
        stores: {
          releases: {
            data: [longTitleRelease],
            byId: new Map([[longTitleRelease._id, longTitleRelease]]),
          },
        },
      })

      expect(result.current.isTruncated).toBe(true)
      expect(result.current.title).toBe(`All users (Default) · ${longTitle.slice(0, 50)}…`)
      expect(result.current.fullTitle).toBe(`All users (Default) · ${longTitle}`)
    })

    it('truncates long release titles without a variant prefix when variants are disabled', async () => {
      const longTitle = 'A'.repeat(60)
      const longTitleRelease: ReleaseDocument = {
        ...activeScheduledRelease,
        metadata: {...activeScheduledRelease.metadata, title: longTitle},
      }

      const {result} = await renderTitle({
        version: createVersion({
          id: `versions.${longTitleRelease.name}.${GROUP_ID}`,
          bundleId: longTitleRelease.name,
          releaseRef: longTitleRelease._id,
        }),
        variantsEnabled: false,
        stores: {
          releases: {
            data: [longTitleRelease],
            byId: new Map([[longTitleRelease._id, longTitleRelease]]),
          },
        },
      })

      expect(result.current.isTruncated).toBe(true)
      expect(result.current.title).toBe(`${longTitle.slice(0, 50)}…`)
      expect(result.current.fullTitle).toBe(longTitle)
    })

    it('falls back to the bundle id when the release ref is not in the store', async () => {
      const {result} = await renderTitle({
        version: createVersion({
          id: `versions.${activeScheduledRelease.name}.${GROUP_ID}`,
          bundleId: activeScheduledRelease.name,
          releaseRef: activeScheduledRelease._id,
        }),
      })

      expect(result.current).toEqual({
        title: activeScheduledRelease.name,
        fullTitle: activeScheduledRelease.name,
        isTruncated: false,
      })
    })
  })

  describe('agent bundle perspectives', () => {
    it('labels own agent bundles as proposed changes', async () => {
      const {result} = await renderTitle({
        version: createVersion({
          id: `versions.${OWN_AGENT_BUNDLE}.${GROUP_ID}`,
          bundleId: OWN_AGENT_BUNDLE,
        }),
        stores: {
          agentBundles: {bundles: [{id: OWN_AGENT_BUNDLE, applicationKey: 'app'}]},
        },
      })

      expect(result.current).toEqual({
        title: 'Proposed changes',
        fullTitle: 'Proposed changes',
        isTruncated: false,
      })
    })

    it('labels other agent bundles as agent changes', async () => {
      const {result} = await renderTitle({
        version: createVersion({
          id: `versions.${OTHER_AGENT_BUNDLE}.${GROUP_ID}`,
          bundleId: OTHER_AGENT_BUNDLE,
        }),
      })

      expect(result.current).toEqual({
        title: 'Agent changes',
        fullTitle: 'Agent changes',
        isTruncated: false,
      })
    })

    it('falls back to published when an agent version has no bundle id', async () => {
      const {result} = await renderTitle({
        version: createVersion({
          id: `versions.${OWN_AGENT_BUNDLE}.${GROUP_ID}`,
        }),
      })

      expect(result.current).toEqual({
        title: 'Published',
        fullTitle: 'Published',
        isTruncated: false,
      })
    })
  })
})
