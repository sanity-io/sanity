import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {variantAlphaAudience} from '../../../variants/__fixtures__/variants.fixture'
import {
  DOCUMENT_STATUS_ICONS_BY_OUTCOME,
  type DocumentStatusIconsOutcome,
  resolveDocumentStatusIcons,
  resolveDocumentStatusIconsOutcome,
} from '../resolveDocumentStatusIcons'

const PUBLISHED_ID = 'article-1'
const RELEASE_BUNDLE_ID = 'rASAP'
const AGENT_BUNDLE_ID = 'agent-abc123'
const VARIANT_ID = variantAlphaAudience._id

const groupRef = {_ref: PUBLISHED_ID, _weak: true} as const
const variantRef = {_ref: VARIANT_ID, _weak: true} as const

function versionStub(
  id: string,
  system: Omit<VersionInfoDocumentStub['_system'], 'group'>,
): VersionInfoDocumentStub {
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

describe('resolveDocumentStatusIcons', () => {
  describe('system perspective, variant selected', () => {
    const context = {
      bundle: 'drafts' as const,
      variantId: VARIANT_ID,
      documentVersions: [] as VersionInfoDocumentStub[],
    }

    it('variantPublishedWithDraft when the variant is published with draft edits', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [publishedVariant, draftVariant],
        }),
      ).toBe('variantPublishedWithDraft')
    })

    it('variantPublished when the variant is published without draft edits', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [publishedVariant],
        }),
      ).toBe('variantPublished')
    })

    it('variantDraftOnly when the variant has never been published', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [draftVariant],
        }),
      ).toBe('variantDraftOnly')
    })

    it('falls back to defaultPublishedWithDraft when the document is not in the variant', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [publishedDefault, draftDefault],
        }),
      ).toBe('defaultPublishedWithDraft')
    })

    it('falls back to defaultPublishedWithDraft while the variants store is still resolving', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          variantId: undefined,
          documentVersions: [publishedDefault, draftDefault, draftVariant],
        }),
      ).toBe('defaultPublishedWithDraft')
    })
  })

  describe('system perspective, no variant selected', () => {
    const context = {
      bundle: 'drafts' as const,
      variantId: undefined,
      documentVersions: [] as VersionInfoDocumentStub[],
    }

    it('defaultPublishedWithDraft when published with draft edits', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [publishedDefault, draftDefault],
        }),
      ).toBe('defaultPublishedWithDraft')
    })

    it('defaultPublished when published without draft edits', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [publishedDefault],
        }),
      ).toBe('defaultPublished')
    })

    it('defaultUnpublished for a document that has never been published', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [draftDefault],
        }),
      ).toBe('defaultUnpublished')
    })

    it('defaultUnpublished when there are no versions', () => {
      expect(resolveDocumentStatusIconsOutcome(context)).toBe('defaultUnpublished')
    })

    it('defaultUnpublished ignores versions scoped to a variant', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [publishedVariant, draftVariant],
        }),
      ).toBe('defaultUnpublished')
    })

    it('behaves the same when the published perspective is selected', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          bundle: 'published',
          variantId: undefined,
          documentVersions: [publishedDefault, draftDefault],
        }),
      ).toBe('defaultPublishedWithDraft')
    })
  })

  describe('release perspective, variant selected', () => {
    const context = {
      bundle: RELEASE_BUNDLE_ID,
      variantId: VARIANT_ID,
      documentVersions: [] as VersionInfoDocumentStub[],
    }

    it('inReleaseWithVariant when the release holds the variant and a default version', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [releaseDefault, releaseVariant],
        }),
      ).toBe('inReleaseWithVariant')
    })

    it('inReleaseWithVariant when the release holds the variant only', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [releaseVariant],
        }),
      ).toBe('inReleaseWithVariant')
    })

    it('inRelease when the release holds the default version only', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [publishedDefault, draftDefault, releaseDefault],
        }),
      ).toBe('inRelease')
    })

    it('notInRelease when the document is not in the release', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [publishedDefault, draftDefault],
        }),
      ).toBe('notInRelease')
    })

    it('inRelease while the variants store is still resolving', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          variantId: undefined,
          documentVersions: [releaseDefault, releaseVariant],
        }),
      ).toBe('inRelease')
    })
  })

  describe('release perspective, no variant selected', () => {
    const context = {
      bundle: RELEASE_BUNDLE_ID,
      variantId: undefined,
      documentVersions: [] as VersionInfoDocumentStub[],
    }

    it('inRelease when the document is in the release', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [publishedDefault, draftDefault, releaseDefault],
        }),
      ).toBe('inRelease')
    })

    it('notInRelease when the document is not in the release', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [publishedDefault, draftDefault],
        }),
      ).toBe('notInRelease')
    })

    it('notInRelease ignores versions of the release scoped to a variant', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [releaseVariant],
        }),
      ).toBe('notInRelease')
    })
  })

  describe('agent bundle perspective', () => {
    const context = {
      bundle: AGENT_BUNDLE_ID,
      variantId: undefined,
      documentVersions: [] as VersionInfoDocumentStub[],
    }

    it('inRelease when the document is in the agent bundle', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [agentDefault],
        }),
      ).toBe('inRelease')
    })

    it('notInRelease when the document is not in the agent bundle', () => {
      expect(
        resolveDocumentStatusIconsOutcome({
          ...context,
          documentVersions: [publishedDefault, draftDefault],
        }),
      ).toBe('notInRelease')
    })
  })
})
