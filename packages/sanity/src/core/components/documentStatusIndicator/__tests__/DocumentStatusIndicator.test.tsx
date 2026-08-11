import {type DocumentSystem} from '@sanity/types'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render} from '@testing-library/react'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  mockUsePerspective,
  usePerspectiveMockReturn,
} from '../../../perspective/__mocks__/usePerspective.mock'
import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {variantAlphaAudience} from '../../../variants/__fixtures__/variants.fixture'
import {DocumentStatusIndicator} from '../DocumentStatusIndicator'

vi.mock('../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

const PUBLISHED_ID = 'article-1'
const RELEASE_BUNDLE_ID = 'rASAP'
// `activeASAPRelease` is an asap release, and asap maps to the caution tone.
const RELEASE_ICON_TESTID = 'release-avatar-caution'
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

// The rhombus has no test id of its own, so it is matched on its icon name instead.
const INDICATOR_SELECTOR =
  '[data-testid^="document-status-dot-"], [data-testid^="release-avatar-"], [data-sanity-icon="rhombus"]'

function wrapper({children}: {children: ReactNode}) {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
}

/** The rendered indicators, in DOM order. */
function renderIndicator(documentVersions: VersionInfoDocumentStub[]): string[] {
  const {container} = render(<DocumentStatusIndicator documentVersions={documentVersions} />, {
    wrapper,
  })

  return Array.from(container.querySelectorAll(INDICATOR_SELECTOR)).map(
    (element) =>
      element.getAttribute('data-testid') ?? element.getAttribute('data-sanity-icon') ?? '',
  )
}

const PUBLISHED_DOT = 'document-status-dot-published'
const DRAFT_DOT = 'document-status-dot-draft'
const RHOMBUS = 'rhombus'

describe('DocumentStatusIndicator', () => {
  beforeEach(() => {
    mockUsePerspective.mockReturnValue(usePerspectiveMockReturn)
  })

  describe('system perspective, no variant selected', () => {
    it('renders a single published dot for a published document', () => {
      expect(renderIndicator([publishedDefault])).toEqual([PUBLISHED_DOT])
    })

    it('renders the draft dot before the published dot when both exist', () => {
      expect(renderIndicator([publishedDefault, draftDefault])).toEqual([DRAFT_DOT, PUBLISHED_DOT])
    })

    it('renders nothing for a document that has never been published', () => {
      expect(renderIndicator([draftDefault])).toEqual([])
    })

    it('renders nothing when there are no versions', () => {
      expect(renderIndicator([])).toEqual([])
    })

    it('describes both system bundles when the published perspective is selected', () => {
      mockUsePerspective.mockReturnValue({
        ...usePerspectiveMockReturn,
        bundle: 'published',
        selectedPerspective: 'published',
        selectedPerspectiveName: 'published',
      })

      expect(renderIndicator([publishedDefault, draftDefault])).toEqual([DRAFT_DOT, PUBLISHED_DOT])
    })

    it('ignores documents belonging to a variant', () => {
      expect(renderIndicator([publishedVariant, draftVariant])).toEqual([])
    })
  })

  describe('system perspective, variant selected', () => {
    beforeEach(() => {
      mockUsePerspective.mockReturnValue({
        ...usePerspectiveMockReturn,
        selectedVariant: variantAlphaAudience,
        selectedVariantName: 'alpha-audience',
      })
    })

    it('renders the rhombus before the variant dots', () => {
      expect(renderIndicator([publishedVariant, draftVariant])).toEqual([
        RHOMBUS,
        DRAFT_DOT,
        PUBLISHED_DOT,
      ])
    })

    it('renders the rhombus and the published dot when the variant has no draft', () => {
      expect(renderIndicator([publishedVariant])).toEqual([RHOMBUS, PUBLISHED_DOT])
    })

    it('renders the rhombus and draft ring when the variant has never been published', () => {
      expect(renderIndicator([draftVariant])).toEqual([RHOMBUS, DRAFT_DOT])
    })

    it('reports the variant, not the default documents', () => {
      expect(renderIndicator([publishedDefault, draftDefault, draftVariant])).toEqual([
        RHOMBUS,
        DRAFT_DOT,
      ])
    })

    it('falls back to the default documents when the document is not in the variant', () => {
      expect(renderIndicator([publishedDefault, draftDefault])).toEqual([DRAFT_DOT, PUBLISHED_DOT])
    })

    it('falls back to the default documents while the variant is still resolving', () => {
      mockUsePerspective.mockReturnValue({
        ...usePerspectiveMockReturn,
        selectedVariant: undefined,
        selectedVariantName: 'alpha-audience',
      })

      expect(renderIndicator([publishedDefault, draftDefault, draftVariant])).toEqual([
        DRAFT_DOT,
        PUBLISHED_DOT,
      ])
    })
  })

  describe('release perspective, no variant selected', () => {
    beforeEach(() => {
      mockUsePerspective.mockReturnValue({
        ...usePerspectiveMockReturn,
        bundle: RELEASE_BUNDLE_ID,
        selectedPerspective: activeASAPRelease,
        selectedPerspectiveName: RELEASE_BUNDLE_ID,
        selectedReleaseId: RELEASE_BUNDLE_ID,
      })
    })

    it('renders only the release icon when the document is in the release', () => {
      expect(renderIndicator([publishedDefault, draftDefault, releaseDefault])).toEqual([
        RELEASE_ICON_TESTID,
      ])
    })

    it('renders nothing when the document is not in the release', () => {
      expect(renderIndicator([publishedDefault, draftDefault])).toEqual([])
    })

    it('ignores documents belonging to a variant of the release', () => {
      expect(renderIndicator([releaseVariant])).toEqual([])
    })
  })

  describe('release perspective, variant selected', () => {
    beforeEach(() => {
      mockUsePerspective.mockReturnValue({
        ...usePerspectiveMockReturn,
        bundle: RELEASE_BUNDLE_ID,
        selectedPerspective: activeASAPRelease,
        selectedPerspectiveName: RELEASE_BUNDLE_ID,
        selectedReleaseId: RELEASE_BUNDLE_ID,
        selectedVariant: variantAlphaAudience,
        selectedVariantName: 'alpha-audience',
      })
    })

    it('renders the rhombus before the release icon when the document is in both', () => {
      expect(renderIndicator([releaseDefault, releaseVariant])).toEqual([
        RHOMBUS,
        RELEASE_ICON_TESTID,
      ])
    })

    it('renders only the rhombus when the document is in the variant alone', () => {
      expect(renderIndicator([releaseVariant])).toEqual([RHOMBUS])
    })

    it('renders only the release icon when the document is in the release alone', () => {
      expect(renderIndicator([releaseDefault])).toEqual([RELEASE_ICON_TESTID])
    })

    it('renders nothing when the document is in neither', () => {
      expect(renderIndicator([publishedDefault, draftDefault])).toEqual([])
    })
  })

  describe('agent bundle perspective', () => {
    it('renders a suggest-toned icon when the document is in the agent bundle', () => {
      mockUsePerspective.mockReturnValue({
        ...usePerspectiveMockReturn,
        bundle: 'agent-abc123',
        selectedPerspective: 'agent-abc123',
        selectedPerspectiveName: 'agent-abc123',
      })

      expect(
        renderIndicator([
          versionStub('versions.agent-abc123.article-1', {
            bundleId: 'agent-abc123',
          }),
        ]),
      ).toEqual(['release-avatar-suggest'])
    })
  })
})
