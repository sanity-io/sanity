import {type DocumentSystem} from '@sanity/types'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render} from '@testing-library/react'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  mockUsePerspective,
  usePerspectiveMockReturn,
} from '../../../perspective/__mocks__/usePerspective.mock'
import {type PerspectiveContextValue} from '../../../perspective/types'
import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {variantAlphaAudience} from '../../../variants/__fixtures__/variants.fixture'
import {DocumentVersionsStatusIndicator} from '../DocumentVersionsStatusIndicator'

vi.mock('../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

const PUBLISHED_ID = 'article-1'
const RELEASE_BUNDLE_ID = 'rASAP'
const AGENT_BUNDLE_ID = 'agent-abc123'
const VARIANT_ID = variantAlphaAudience._id

const groupRef = {_ref: PUBLISHED_ID, _weak: true} as const
const variantRef = {_ref: VARIANT_ID, _weak: true} as const

function versionStub(id: string, system: Omit<DocumentSystem, 'group'>): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: '',
    _createdAt: '',
    _updatedAt: '',
    _system: {group: groupRef, ...system},
  }
}

const publishedDefault = versionStub(PUBLISHED_ID, {})
const draftDefault = versionStub('drafts.article-1', {bundleId: 'drafts'})
const publishedVariant = versionStub('published.alpha.article-1', {variant: variantRef})
const draftVariant = versionStub('drafts.alpha.article-1', {
  bundleId: 'drafts',
  variant: variantRef,
})
const releaseDefault = versionStub('versions.rASAP.article-1', {bundleId: RELEASE_BUNDLE_ID})
const releaseVariant = versionStub('versions.alpha.article-1', {
  bundleId: RELEASE_BUNDLE_ID,
  variant: variantRef,
})
const agentDefault = versionStub('versions.agent-abc123.article-1', {bundleId: AGENT_BUNDLE_ID})

const VARIANT_SELECTED: Partial<PerspectiveContextValue> = {
  selectedVariant: variantAlphaAudience,
  selectedVariantName: 'alpha-audience',
}

// The variants store has not resolved the selected variant yet, which degrades to the default
// variant.
const VARIANT_RESOLVING: Partial<PerspectiveContextValue> = {
  selectedVariant: undefined,
  selectedVariantName: 'alpha-audience',
}

const RELEASE_PERSPECTIVE: Partial<PerspectiveContextValue> = {
  bundle: RELEASE_BUNDLE_ID,
  selectedPerspective: activeASAPRelease,
  selectedPerspectiveName: RELEASE_BUNDLE_ID,
  selectedReleaseId: RELEASE_BUNDLE_ID,
}

function mockPerspective(...overrides: Partial<PerspectiveContextValue>[]) {
  mockUsePerspective.mockReturnValue(Object.assign({...usePerspectiveMockReturn}, ...overrides))
}

// Temporary icons expose stable `data-sanity-icon` names; release avatars use test ids.
const INDICATOR_SELECTOR =
  '[data-sanity-icon="rhombus"], [data-sanity-icon="ring"], [data-sanity-icon="circle-small"], [data-testid^="release-avatar-"]'

function wrapper({children}: {children: ReactNode}) {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
}

/** The rendered indicators, in DOM order. */
function renderIndicator(documentVersions: VersionInfoDocumentStub[]): string[] {
  const {container} = render(
    <DocumentVersionsStatusIndicator documentVersions={documentVersions} />,
    {
      wrapper,
    },
  )

  return Array.from(container.querySelectorAll(INDICATOR_SELECTOR)).map(
    (element) =>
      element.getAttribute('data-testid') ?? element.getAttribute('data-sanity-icon') ?? '',
  )
}

const GREEN_DISC = 'circle-small'
const YELLOW_RING = 'ring'
const RHOMBUS = 'rhombus'
// `activeASAPRelease` is an asap release, and asap maps to the caution tone.
const RELEASE_ICON = 'release-avatar-caution'
// Agent bundles have no release document, so they fall back to the suggest-toned dot.
const AGENT_ICON = 'release-avatar-suggest'

// Cases follow resolveDocumentStatusIcons.ts: perspective first, then variant selection.
describe('DocumentVersionsStatusIndicator', () => {
  beforeEach(() => {
    mockPerspective()
  })

  describe('system perspective, variant selected', () => {
    beforeEach(() => {
      mockPerspective(VARIANT_SELECTED)
    })

    it('renders the rhombus, yellow ring and green disc when the variant is published with draft edits', () => {
      expect(renderIndicator([publishedVariant, draftVariant])).toEqual([
        RHOMBUS,
        YELLOW_RING,
        GREEN_DISC,
      ])
    })

    it('renders the rhombus and green disc when the variant is published without draft edits', () => {
      expect(renderIndicator([publishedVariant])).toEqual([RHOMBUS, GREEN_DISC])
    })

    it('renders the rhombus and yellow ring when the variant has never been published', () => {
      expect(renderIndicator([draftVariant])).toEqual([RHOMBUS, YELLOW_RING])
    })

    it('takes over from the default documents when the document exists in the variant', () => {
      expect(renderIndicator([publishedDefault, draftDefault, draftVariant])).toEqual([
        RHOMBUS,
        YELLOW_RING,
      ])
    })

    it('falls back to the default documents when the document is not in the variant', () => {
      expect(renderIndicator([publishedDefault, draftDefault])).toEqual([YELLOW_RING, GREEN_DISC])
    })

    it('falls back to the default documents while the variants store is still resolving', () => {
      mockPerspective(VARIANT_RESOLVING)

      expect(renderIndicator([publishedDefault, draftDefault, draftVariant])).toEqual([
        YELLOW_RING,
        GREEN_DISC,
      ])
    })
  })

  describe('system perspective, no variant selected', () => {
    it('renders the yellow ring and green disc when published with draft edits', () => {
      expect(renderIndicator([publishedDefault, draftDefault])).toEqual([YELLOW_RING, GREEN_DISC])
    })

    it('renders the green disc when published without draft edits', () => {
      expect(renderIndicator([publishedDefault])).toEqual([GREEN_DISC])
    })

    it('renders nothing for a document that has never been published', () => {
      expect(renderIndicator([draftDefault])).toEqual([])
    })

    it('renders nothing when there are no versions', () => {
      expect(renderIndicator([])).toEqual([])
    })

    it('ignores versions scoped to a variant', () => {
      expect(renderIndicator([publishedVariant, draftVariant])).toEqual([])
    })

    it('behaves the same when the published perspective is selected', () => {
      mockPerspective({
        bundle: 'published',
        selectedPerspective: 'published',
        selectedPerspectiveName: 'published',
      })

      expect(renderIndicator([publishedDefault, draftDefault])).toEqual([YELLOW_RING, GREEN_DISC])
    })
  })

  describe('release perspective, variant selected', () => {
    beforeEach(() => {
      mockPerspective(RELEASE_PERSPECTIVE, VARIANT_SELECTED)
    })

    it('renders the rhombus and release icon when the release holds the variant and a default version', () => {
      expect(renderIndicator([releaseDefault, releaseVariant])).toEqual([RHOMBUS, RELEASE_ICON])
    })

    it('renders the rhombus and release icon when the release holds the variant only', () => {
      expect(renderIndicator([releaseVariant])).toEqual([RHOMBUS, RELEASE_ICON])
    })

    it('renders the release icon alone when the release holds the default version only', () => {
      // The publish state of the default documents is never described under a release.
      expect(renderIndicator([publishedDefault, draftDefault, releaseDefault])).toEqual([
        RELEASE_ICON,
      ])
    })

    it('renders nothing when the document is not in the release', () => {
      expect(renderIndicator([publishedDefault, draftDefault])).toEqual([])
    })

    it('describes the release alone while the variants store is still resolving', () => {
      mockPerspective(RELEASE_PERSPECTIVE, VARIANT_RESOLVING)

      expect(renderIndicator([releaseDefault, releaseVariant])).toEqual([RELEASE_ICON])
    })
  })

  describe('release perspective, no variant selected', () => {
    beforeEach(() => {
      mockPerspective(RELEASE_PERSPECTIVE)
    })

    it('renders the release icon when the document is in the release', () => {
      // The publish state of the default documents is never described under a release.
      expect(renderIndicator([publishedDefault, draftDefault, releaseDefault])).toEqual([
        RELEASE_ICON,
      ])
    })

    it('renders nothing when the document is not in the release', () => {
      expect(renderIndicator([publishedDefault, draftDefault])).toEqual([])
    })

    it('ignores versions of the release scoped to a variant', () => {
      expect(renderIndicator([releaseVariant])).toEqual([])
    })
  })

  // Agent bundles take the same branch as releases; only the icon they resolve to differs.
  describe('agent bundle perspective', () => {
    beforeEach(() => {
      mockPerspective({
        bundle: AGENT_BUNDLE_ID,
        selectedPerspective: AGENT_BUNDLE_ID,
        selectedPerspectiveName: AGENT_BUNDLE_ID,
      })
    })

    it('renders a suggest-toned icon when the document is in the agent bundle', () => {
      expect(renderIndicator([agentDefault])).toEqual([AGENT_ICON])
    })

    it('renders nothing when the document is not in the agent bundle', () => {
      expect(renderIndicator([publishedDefault, draftDefault])).toEqual([])
    })
  })
})
