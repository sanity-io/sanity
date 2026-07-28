import {type ReleaseDocument} from '@sanity/client'
import {type DocumentSystem} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type TFunction} from '../../i18n/types'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {type AgentBundle} from '../../store/agent/createAgentBundlesStore'
import {
  variantAlphaAudience,
  variantNorwegianMarket,
} from '../../variants/__fixtures__/variants.fixture'
import {type SystemVariant} from '../../variants/types'
import {type Meta} from '../machines/documentGroupInventoryMachine'
import {computeSets} from './computeSets'

const t = ((key: string) => key) as unknown as TFunction

const PUBLISHED_ID = 'article'
const RELEASE_ID = 'rABC'
const AGENT_BUNDLE_ID = 'agent-abc123'

const releaseDocument = {metadata: {title: 'My release'}} as unknown as ReleaseDocument

// Builds the version document stub the way `useDocumentVersions` emits it.
function stub(id: string, system: Partial<DocumentSystem> = {}): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _system: {
      group: {_ref: PUBLISHED_ID, _weak: true},
      ...system,
    },
  }
}

// The base (variant-less) draft of the document group.
function draft(): VersionInfoDocumentStub {
  return stub(`drafts.${PUBLISHED_ID}`, {bundleId: 'drafts'})
}

// The base (variant-less) published document. The group document references
// itself, which is how published documents are recognised.
function published(): VersionInfoDocumentStub {
  return stub(PUBLISHED_ID)
}

// A base (variant-less) version of the document inside a release.
function releaseVersion(releaseId: string): VersionInfoDocumentStub {
  return stub(`versions.${releaseId}.${PUBLISHED_ID}`, {
    bundleId: releaseId,
    release: {_ref: getReleaseDocumentIdFromReleaseId(releaseId), _weak: true},
  })
}

// A version held in an agent bundle, produced by Content Agent.
function agentVersion(bundleId: string): VersionInfoDocumentStub {
  return stub(`versions.${bundleId}.${PUBLISHED_ID}`, {bundleId})
}

// A draft of a variant, outside any release.
function variantDraft(variant: SystemVariant, scopeId: string): VersionInfoDocumentStub {
  return stub(`drafts.${scopeId}.${PUBLISHED_ID}`, {
    bundleId: 'drafts',
    variant: {_ref: variant._id, _weak: true},
    scopeId,
  })
}

// A published variant, outside any release.
function variantPublished(variant: SystemVariant, scopeId: string): VersionInfoDocumentStub {
  return stub(`published.${scopeId}.${PUBLISHED_ID}`, {
    variant: {_ref: variant._id, _weak: true},
    scopeId,
  })
}

// A version of a variant inside a release.
function variantInRelease(
  variant: SystemVariant,
  scopeId: string,
  releaseId: string,
): VersionInfoDocumentStub {
  return stub(`versions.${releaseId}.${scopeId}.${PUBLISHED_ID}`, {
    bundleId: releaseId,
    release: {_ref: getReleaseDocumentIdFromReleaseId(releaseId), _weak: true},
    variant: {_ref: variant._id, _weak: true},
    scopeId,
  })
}

function createMeta({
  versions,
  releases = new Map(),
  variants = new Map(),
  bundles = [],
}: {
  versions: VersionInfoDocumentStub[]
  releases?: Map<string, ReleaseDocument>
  variants?: Map<string, SystemVariant>
  bundles?: AgentBundle[]
}): Meta {
  return {
    versionState: {
      data: versions.map(({_id}) => _id),
      versions,
      loading: false,
      error: null,
    },
    releases: {releases, state: 'loaded'},
    variants: {variants, state: 'loaded'},
    agentBundles: {bundles, loading: false},
  }
}

describe('computeSets', () => {
  describe('when Content Variants is not enabled', () => {
    it('assembles a single set from draft, published, release, and agent documents', () => {
      const versions = [
        draft(),
        published(),
        releaseVersion(RELEASE_ID),
        agentVersion(AGENT_BUNDLE_ID),
      ]

      const meta = createMeta({
        versions,
        releases: new Map([[getReleaseDocumentIdFromReleaseId(RELEASE_ID), releaseDocument]]),
        // The agent bundle is owned by the current user.
        bundles: [{id: AGENT_BUNDLE_ID, applicationKey: 'application-key'}],
      })

      expect(computeSets({meta, current: [], t, variantsEnabled: false})).toEqual([
        {
          key: 'studio:all',
          name: 'document-group-inventory.title',
          variants: [
            // The user's agent bundle surfaces as "proposed changes" first,
            // while the raw agent version is hidden from the list.
            {
              id: `versions.${AGENT_BUNDLE_ID}.${PUBLISHED_ID}`,
              name: 'version.agent-bundle.proposed-changes',
            },
            {id: `drafts.${PUBLISHED_ID}`, name: 'release.chip.draft', document: versions[0]},
            {id: PUBLISHED_ID, name: 'release.chip.published', document: versions[1]},
            {
              id: `versions.${RELEASE_ID}.${PUBLISHED_ID}`,
              name: 'My release',
              document: versions[2],
            },
          ],
        },
      ])
    })
  })

  describe('when Content Variants is enabled', () => {
    it('assembles a set per bundle from draft, published, release, variant, and agent documents', () => {
      const versions = [
        draft(),
        variantDraft(variantAlphaAudience, 'scopeA'),
        variantDraft(variantNorwegianMarket, 'scopeB'),
        published(),
        variantPublished(variantAlphaAudience, 'scopeA'),
        variantPublished(variantNorwegianMarket, 'scopeB'),
        releaseVersion(RELEASE_ID),
        variantInRelease(variantAlphaAudience, 'scopeA', RELEASE_ID),
        agentVersion(AGENT_BUNDLE_ID),
      ]

      const meta = createMeta({
        versions,
        releases: new Map([[getReleaseDocumentIdFromReleaseId(RELEASE_ID), releaseDocument]]),
        variants: new Map([
          [variantAlphaAudience._id, variantAlphaAudience],
          [variantNorwegianMarket._id, variantNorwegianMarket],
        ]),
        // The agent bundle is owned by the current user.
        bundles: [{id: AGENT_BUNDLE_ID, applicationKey: 'application-key'}],
      })

      expect(computeSets({meta, current: [], t, variantsEnabled: true})).toEqual([
        {
          key: 'studio:content-agent',
          name: 'content-agent',
          variants: [
            {
              id: `versions.${AGENT_BUNDLE_ID}.${PUBLISHED_ID}`,
              name: 'version.agent-bundle.proposed-changes',
            },
          ],
        },
        {
          key: 'drafts',
          name: 'release.chip.draft',
          variants: [
            {
              id: `drafts.${PUBLISHED_ID}`,
              name: 'document-group.base-variant',
              releaseDocument: undefined,
              document: versions[0],
            },
            {
              id: `drafts.scopeA.${PUBLISHED_ID}`,
              name: 'Alpha audience',
              releaseDocument: undefined,
              document: versions[1],
            },
            {
              id: `drafts.scopeB.${PUBLISHED_ID}`,
              name: 'Norwegian market',
              releaseDocument: undefined,
              document: versions[2],
            },
          ],
        },
        {
          key: 'published',
          name: 'release.chip.published',
          variants: [
            {
              id: PUBLISHED_ID,
              name: 'document-group.base-variant',
              releaseDocument: undefined,
              document: versions[3],
            },
            {
              id: `published.scopeA.${PUBLISHED_ID}`,
              name: 'Alpha audience',
              releaseDocument: undefined,
              document: versions[4],
            },
            {
              id: `published.scopeB.${PUBLISHED_ID}`,
              name: 'Norwegian market',
              releaseDocument: undefined,
              document: versions[5],
            },
          ],
        },
        {
          key: getReleaseDocumentIdFromReleaseId(RELEASE_ID),
          name: 'My release',
          variants: [
            {
              id: `versions.${RELEASE_ID}.${PUBLISHED_ID}`,
              name: 'document-group.base-variant',
              releaseDocument,
              document: versions[6],
            },
            {
              id: `versions.${RELEASE_ID}.scopeA.${PUBLISHED_ID}`,
              name: 'Alpha audience',
              releaseDocument,
              document: versions[7],
            },
          ],
        },
      ])
    })

    it('groups variant drafts into the drafts set alongside the base draft', () => {
      const versions = [
        draft(),
        variantDraft(variantAlphaAudience, 'scopeA'),
        variantDraft(variantNorwegianMarket, 'scopeB'),
      ]

      const meta = createMeta({
        versions,
        variants: new Map([
          [variantAlphaAudience._id, variantAlphaAudience],
          [variantNorwegianMarket._id, variantNorwegianMarket],
        ]),
      })

      const sets = computeSets({meta, current: [], t, variantsEnabled: true})

      expect(sets).toHaveLength(1)
      expect(sets[0]?.key).toBe('drafts')
      expect(sets[0]?.variants.map(({id}) => id)).toEqual([
        `drafts.${PUBLISHED_ID}`,
        `drafts.scopeA.${PUBLISHED_ID}`,
        `drafts.scopeB.${PUBLISHED_ID}`,
      ])
    })

    it('groups published variants into the published set alongside the published document', () => {
      const versions = [
        published(),
        variantPublished(variantAlphaAudience, 'scopeA'),
        variantPublished(variantNorwegianMarket, 'scopeB'),
      ]

      const meta = createMeta({
        versions,
        variants: new Map([
          [variantAlphaAudience._id, variantAlphaAudience],
          [variantNorwegianMarket._id, variantNorwegianMarket],
        ]),
      })

      const sets = computeSets({meta, current: [], t, variantsEnabled: true})

      expect(sets).toHaveLength(1)
      expect(sets[0]?.key).toBe('published')
      expect(sets[0]?.variants.map(({id}) => id)).toEqual([
        PUBLISHED_ID,
        `published.scopeA.${PUBLISHED_ID}`,
        `published.scopeB.${PUBLISHED_ID}`,
      ])
    })

    it('groups variants inside a release under that release', () => {
      const versions = [
        releaseVersion(RELEASE_ID),
        variantInRelease(variantAlphaAudience, 'scopeA', RELEASE_ID),
      ]

      const meta = createMeta({
        versions,
        releases: new Map([[getReleaseDocumentIdFromReleaseId(RELEASE_ID), releaseDocument]]),
        variants: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
      })

      const sets = computeSets({meta, current: [], t, variantsEnabled: true})

      expect(sets).toHaveLength(1)
      expect(sets[0]?.key).toBe(getReleaseDocumentIdFromReleaseId(RELEASE_ID))
      expect(sets[0]?.name).toBe('My release')
      expect(sets[0]?.variants.map(({name}) => name)).toEqual([
        'document-group.base-variant',
        'Alpha audience',
      ])
    })
  })
})
