import {type DocumentSystem} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type PerspectiveContextValue} from '../../perspective/types'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {
  variantAlphaAudience,
  variantNorwegianMarket,
} from '../../variants/__fixtures__/variants.fixture'
import {type SystemVariant} from '../../variants/types'
import {resolveServedVersion} from './resolveServedVersion'

const PUBLISHED_ID = 'article'
const RELEASE_A = 'rA'
const RELEASE_B = 'rB'

function stub(id: string, system: Partial<DocumentSystem> = {}): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: 'article',
    _system: {group: {_ref: PUBLISHED_ID, _weak: true}, ...system},
  }
}

const published = stub(PUBLISHED_ID)
const draft = stub(`drafts.${PUBLISHED_ID}`, {bundleId: 'drafts'})

function releaseVersion(releaseId: string): VersionInfoDocumentStub {
  return stub(`versions.${releaseId}.${PUBLISHED_ID}`, {
    bundleId: releaseId,
    release: {_ref: getReleaseDocumentIdFromReleaseId(releaseId), _weak: true},
  })
}

function variantVersion(
  variant: SystemVariant,
  bundleId: string | undefined,
): VersionInfoDocumentStub {
  const scopeId = `scope-${variant._id}`
  const prefix = bundleId ? `versions.${bundleId}` : 'published'

  return stub(`${prefix}.${scopeId}.${PUBLISHED_ID}`, {
    ...(bundleId ? {bundleId} : {}),
    variants: [{_ref: variant._id, _key: 'k'}],
    scopeId,
  })
}

type Perspective = Pick<
  PerspectiveContextValue,
  'bundle' | 'selectedVariantNames' | 'selectedVariants'
>

function perspective(
  bundle: string,
  variant?: {name: string; definition: SystemVariant | undefined},
): Perspective {
  return {
    bundle,
    selectedVariantNames: variant ? [variant.name] : [],
    selectedVariants: variant ? [variant.definition] : [],
  }
}

const alpha = {name: 'alpha', definition: variantAlphaAudience}

function resolve(options: {
  perspective: Perspective
  versions: VersionInfoDocumentStub[]
  variantsEnabled?: boolean
}) {
  return resolveServedVersion({variantsEnabled: true, ...options})
}

describe('resolveServedVersion', () => {
  describe('without a selected variant', () => {
    it('serves the base version in the selected bundle', () => {
      expect(resolve({perspective: perspective('drafts'), versions: [published, draft]})).toEqual({
        id: draft._id,
        status: 'primary',
      })

      expect(
        resolve({perspective: perspective('published'), versions: [published, draft]}),
      ).toEqual({id: published._id, status: 'primary'})

      expect(
        resolve({
          perspective: perspective(RELEASE_A),
          versions: [published, draft, releaseVersion(RELEASE_A)],
        }),
      ).toEqual({id: releaseVersion(RELEASE_A)._id, status: 'primary'})
    })

    it('serves the published version as primary when the selected bundle is missing', () => {
      expect(resolve({perspective: perspective('drafts'), versions: [published]})).toEqual({
        id: published._id,
        status: 'primary',
      })

      // Other bundles in the perspective stack are skipped, however close to the selected one.
      expect(
        resolve({
          perspective: perspective(RELEASE_B),
          versions: [published, draft, releaseVersion(RELEASE_A)],
        }),
      ).toEqual({id: published._id, status: 'primary'})
    })

    it('serves nothing when the selected bundle and published are both missing', () => {
      expect(
        resolve({
          perspective: perspective(RELEASE_A),
          versions: [draft, releaseVersion(RELEASE_B)],
        }),
      ).toBeUndefined()
    })
  })

  describe('with a selected variant', () => {
    it('serves the variant version in the selected bundle', () => {
      const alphaDraft = variantVersion(variantAlphaAudience, 'drafts')
      const alphaPublished = variantVersion(variantAlphaAudience, undefined)

      expect(
        resolve({
          perspective: perspective('drafts', alpha),
          versions: [published, draft, alphaDraft, alphaPublished],
        }),
      ).toEqual({id: alphaDraft._id, status: 'primary'})

      expect(
        resolve({
          perspective: perspective('published', alpha),
          versions: [published, draft, alphaDraft, alphaPublished],
        }),
      ).toEqual({id: alphaPublished._id, status: 'primary'})

      const alphaInRelease = variantVersion(variantAlphaAudience, RELEASE_A)

      expect(
        resolve({
          perspective: perspective(RELEASE_A, alpha),
          versions: [published, releaseVersion(RELEASE_A), alphaDraft, alphaInRelease],
        }),
      ).toEqual({id: alphaInRelease._id, status: 'primary'})
    })

    it('serves the published variant version before the base version in the selected bundle', () => {
      const alphaPublished = variantVersion(variantAlphaAudience, undefined)

      expect(
        resolve({
          perspective: perspective('drafts', alpha),
          versions: [published, draft, alphaPublished],
        }),
      ).toEqual({id: alphaPublished._id, status: 'primary'})

      expect(
        resolve({
          perspective: perspective(RELEASE_A, alpha),
          versions: [published, releaseVersion(RELEASE_A), alphaPublished],
        }),
      ).toEqual({id: alphaPublished._id, status: 'primary'})

      // Live-edit types have no drafts lane, so this is what they serve on the drafts bundle.
      expect(
        resolve({
          perspective: perspective('drafts', alpha),
          versions: [published, alphaPublished],
        }),
      ).toEqual({id: alphaPublished._id, status: 'primary'})
    })

    it('serves the base version instead when the variant is in neither bundle', () => {
      expect(
        resolve({
          perspective: perspective('drafts', alpha),
          versions: [published, draft, variantVersion(variantNorwegianMarket, 'drafts')],
        }),
      ).toEqual({id: draft._id, status: 'secondary'})

      // The variant in another bundle of the perspective stack is not considered.
      expect(
        resolve({
          perspective: perspective(RELEASE_A, alpha),
          versions: [
            published,
            draft,
            releaseVersion(RELEASE_A),
            variantVersion(variantAlphaAudience, 'drafts'),
          ],
        }),
      ).toEqual({id: releaseVersion(RELEASE_A)._id, status: 'secondary'})
    })

    it('serves the published base version instead when the selected bundle is missing', () => {
      expect(
        resolve({
          perspective: perspective(RELEASE_A, alpha),
          versions: [
            published,
            draft,
            releaseVersion(RELEASE_B),
            variantVersion(variantAlphaAudience, 'drafts'),
          ],
        }),
      ).toEqual({id: published._id, status: 'secondary'})
    })

    it('serves nothing while the variant definition is unresolved', () => {
      expect(
        resolve({
          perspective: perspective('drafts', {name: 'alpha', definition: undefined}),
          versions: [published, draft, variantVersion(variantAlphaAudience, 'drafts')],
        }),
      ).toBeUndefined()
    })

    it('ignores the selected variant while Content Variants is switched off', () => {
      expect(
        resolve({
          variantsEnabled: false,
          perspective: perspective('drafts', {name: 'alpha', definition: undefined}),
          versions: [published, draft, variantVersion(variantAlphaAudience, 'drafts')],
        }),
      ).toEqual({id: draft._id, status: 'primary'})

      expect(
        resolve({
          variantsEnabled: false,
          perspective: perspective('drafts', alpha),
          versions: [published],
        }),
      ).toEqual({id: published._id, status: 'primary'})
    })
  })

  describe('with a version slated to be unpublished', () => {
    it('serves nothing when the primary version is going to be unpublished', () => {
      const unpublishing = stub(`versions.${RELEASE_A}.${PUBLISHED_ID}`, {
        bundleId: RELEASE_A,
        release: {_ref: getReleaseDocumentIdFromReleaseId(RELEASE_A), _weak: true},
        delete: true,
      })

      // Published is not badged in its place, since Content Lake serves the unpublishing version.
      expect(
        resolve({perspective: perspective(RELEASE_A), versions: [published, unpublishing]}),
      ).toBeUndefined()

      const alphaUnpublishing = stub(variantVersion(variantAlphaAudience, RELEASE_A)._id, {
        ...variantVersion(variantAlphaAudience, RELEASE_A)._system,
        delete: true,
      })

      expect(
        resolve({
          perspective: perspective(RELEASE_A, alpha),
          versions: [published, releaseVersion(RELEASE_A), alphaUnpublishing],
        }),
      ).toBeUndefined()
    })

    it('serves nothing instead when the base version is going to be unpublished', () => {
      const unpublishing = stub(`versions.${RELEASE_A}.${PUBLISHED_ID}`, {
        bundleId: RELEASE_A,
        release: {_ref: getReleaseDocumentIdFromReleaseId(RELEASE_A), _weak: true},
        delete: true,
      })

      expect(
        resolve({
          perspective: perspective(RELEASE_A, alpha),
          versions: [published, unpublishing, variantVersion(variantNorwegianMarket, RELEASE_A)],
        }),
      ).toBeUndefined()
    })
  })

  describe('with an agent bundle selected', () => {
    const agentVersion = stub(`versions.agent-abc.${PUBLISHED_ID}`, {bundleId: 'agent-abc'})

    it('serves the published version, since agent bundles are never served to end users', () => {
      expect(
        resolve({
          perspective: perspective('agent-abc'),
          versions: [published, draft, agentVersion],
        }),
      ).toEqual({id: published._id, status: 'primary'})
    })

    it('serves the published variant version, skipping the agent bundle', () => {
      const alphaPublished = variantVersion(variantAlphaAudience, undefined)

      expect(
        resolve({
          perspective: perspective('agent-abc', alpha),
          versions: [
            published,
            agentVersion,
            variantVersion(variantAlphaAudience, 'agent-abc'),
            alphaPublished,
          ],
        }),
      ).toEqual({id: alphaPublished._id, status: 'primary'})
    })

    it('serves the published base version instead when the variant is not published', () => {
      expect(
        resolve({
          perspective: perspective('agent-abc', alpha),
          versions: [published, agentVersion, variantVersion(variantAlphaAudience, 'agent-abc')],
        }),
      ).toEqual({id: published._id, status: 'secondary'})
    })

    it('serves nothing when nothing is published', () => {
      expect(
        resolve({perspective: perspective('agent-abc'), versions: [draft, agentVersion]}),
      ).toBeUndefined()
    })
  })
})
