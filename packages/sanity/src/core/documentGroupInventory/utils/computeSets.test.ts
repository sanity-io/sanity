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
import {computeSets, type InventorySetPlacement} from './computeSets'

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
    _type: 'article',
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
    variants: [{_ref: variant._id, _key: 'k-123'}],
    scopeId,
  })
}

// A published variant, outside any release.
function variantPublished(variant: SystemVariant, scopeId: string): VersionInfoDocumentStub {
  return stub(`published.${scopeId}.${PUBLISHED_ID}`, {
    variants: [{_ref: variant._id, _key: 'k-123'}],
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
    variants: [{_ref: variant._id, _key: 'k-123'}],
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

// A release document as the releases store holds it, keyed by its document id.
function release(
  releaseId: string,
  metadata: Partial<ReleaseDocument['metadata']>,
  createdAt = '2026-01-01T00:00:00.000Z',
): ReleaseDocument {
  return {
    _id: getReleaseDocumentIdFromReleaseId(releaseId),
    _type: 'system.release',
    _rev: 'rev',
    _createdAt: createdAt,
    _updatedAt: createdAt,
    name: releaseId,
    state: 'active',
    metadata: {title: releaseId, releaseType: 'undecided', ...metadata},
  } as ReleaseDocument
}

function releaseMap(releases: ReleaseDocument[]): Map<string, ReleaseDocument> {
  return new Map(releases.map((doc) => [doc._id, doc]))
}

// A spread of every kind of bundle, handed over in an order that matches none of the sorted ones.
const ORDER_RELEASES = [
  release('rUndecided', {releaseType: 'undecided'}),
  release('rLate', {releaseType: 'scheduled', intendedPublishAt: '2026-03-01T00:00:00.000Z'}),
  release('rScheduledDraft', {
    releaseType: 'scheduled',
    cardinality: 'one',
    intendedPublishAt: '2026-02-01T00:00:00.000Z',
  }),
  release('rAsap', {releaseType: 'asap'}),
  release('rEarly', {releaseType: 'scheduled', intendedPublishAt: '2026-01-15T00:00:00.000Z'}),
]

function orderVersions(): VersionInfoDocumentStub[] {
  return [
    published(),
    releaseVersion('rUndecided'),
    releaseVersion('rLate'),
    agentVersion(AGENT_BUNDLE_ID),
    releaseVersion('rScheduledDraft'),
    draft(),
    releaseVersion('rAsap'),
    releaseVersion('rEarly'),
  ]
}

function orderMeta(): Meta {
  return createMeta({
    versions: orderVersions(),
    releases: releaseMap(ORDER_RELEASES),
    bundles: [{id: AGENT_BUNDLE_ID, applicationKey: 'application-key'}],
  })
}

const releaseKey = getReleaseDocumentIdFromReleaseId

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
              document: versions[3],
            },
            {id: PUBLISHED_ID, name: 'release.chip.published', document: versions[1]},
            {id: `drafts.${PUBLISHED_ID}`, name: 'release.chip.draft', document: versions[0]},
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
          bundle: {type: 'agent'},
          variants: [
            {
              id: `versions.${AGENT_BUNDLE_ID}.${PUBLISHED_ID}`,
              name: 'version.agent-bundle.proposed-changes',
              document: versions[8],
            },
          ],
        },
        {
          key: 'published',
          name: 'release.chip.published',
          bundle: {type: 'perspective', perspective: 'published'},
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
          key: 'drafts',
          name: 'release.chip.draft',
          bundle: {type: 'perspective', perspective: 'drafts'},
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
          key: getReleaseDocumentIdFromReleaseId(RELEASE_ID),
          name: 'My release',
          bundle: {type: 'perspective', perspective: releaseDocument},
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
      expect(sets[0]?.bundle).toEqual({type: 'perspective', perspective: 'drafts'})
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
      expect(sets[0]?.bundle).toEqual({type: 'perspective', perspective: 'published'})
      expect(sets[0]?.variants.map(({id}) => id)).toEqual([
        PUBLISHED_ID,
        `published.scopeA.${PUBLISHED_ID}`,
        `published.scopeB.${PUBLISHED_ID}`,
      ])
    })

    it('falls back to an empty perspective for a release that is not loaded', () => {
      const meta = createMeta({versions: [releaseVersion(RELEASE_ID)]})

      const sets = computeSets({meta, current: [], t, variantsEnabled: true})

      expect(sets).toHaveLength(1)
      expect(sets[0]?.bundle).toEqual({type: 'perspective', perspective: ''})
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
      expect(sets[0]?.bundle).toEqual({type: 'perspective', perspective: releaseDocument})
      expect(sets[0]?.variants.map(({name}) => name)).toEqual([
        'document-group.base-variant',
        'Alpha audience',
      ])
    })
  })
  describe('order', () => {
    it('lists Proposed changes, Published, Drafts, then releases by when they go out', () => {
      const sets = computeSets({meta: orderMeta(), current: [], t, variantsEnabled: true})

      expect(sets.map(({key}) => key)).toEqual([
        'studio:content-agent',
        'published',
        'drafts',
        releaseKey('rAsap'),
        releaseKey('rEarly'),
        releaseKey('rScheduledDraft'),
        releaseKey('rLate'),
        releaseKey('rUndecided'),
      ])
    })

    it('counts the versions in every set', () => {
      const sets = computeSets({meta: orderMeta(), current: [], t, variantsEnabled: true})

      expect(sets.map(({variants}) => variants.length)).toEqual([1, 1, 1, 1, 1, 1, 1, 1])
    })

    it('keeps a release that has not loaded among the releases', () => {
      const meta = createMeta({
        versions: [published(), releaseVersion('rMissing'), releaseVersion('rAsap'), draft()],
        releases: releaseMap([release('rAsap', {releaseType: 'asap'})]),
      })

      const sets = computeSets({meta, current: [], t, variantsEnabled: true})

      expect(sets.map(({key}) => key)).toEqual([
        'published',
        'drafts',
        releaseKey('rAsap'),
        releaseKey('rMissing'),
      ])
    })

    it('orders the rows of the single set the same way while Content Variants is off', () => {
      const sets = computeSets({meta: orderMeta(), current: [], t, variantsEnabled: false})

      expect(sets).toHaveLength(1)
      expect(sets[0]?.variants.map(({id}) => id)).toEqual([
        `versions.${AGENT_BUNDLE_ID}.${PUBLISHED_ID}`,
        PUBLISHED_ID,
        `drafts.${PUBLISHED_ID}`,
        `versions.rAsap.${PUBLISHED_ID}`,
        `versions.rEarly.${PUBLISHED_ID}`,
        `versions.rScheduledDraft.${PUBLISHED_ID}`,
        `versions.rLate.${PUBLISHED_ID}`,
        `versions.rUndecided.${PUBLISHED_ID}`,
      ])
    })

    describe('with the placement pending the Q3 decision changed', () => {
      const placement: InventorySetPlacement = {
        proposedChanges: 'afterDrafts',
        scheduledDrafts: 'afterReleases',
      }

      it('moves Proposed changes after Drafts and scheduled drafts after the releases', () => {
        const sets = computeSets({
          meta: orderMeta(),
          current: [],
          t,
          variantsEnabled: true,
          placement,
        })

        expect(sets.map(({key}) => key)).toEqual([
          'published',
          'drafts',
          'studio:content-agent',
          releaseKey('rAsap'),
          releaseKey('rEarly'),
          releaseKey('rLate'),
          releaseKey('rUndecided'),
          releaseKey('rScheduledDraft'),
        ])
      })

      it('applies to the single set while Content Variants is off', () => {
        const sets = computeSets({
          meta: orderMeta(),
          current: [],
          t,
          variantsEnabled: false,
          placement,
        })

        expect(sets[0]?.variants.slice(0, 3).map(({id}) => id)).toEqual([
          PUBLISHED_ID,
          `drafts.${PUBLISHED_ID}`,
          `versions.${AGENT_BUNDLE_ID}.${PUBLISHED_ID}`,
        ])
      })

      it('puts Proposed changes first when there are no drafts', () => {
        const meta = createMeta({
          versions: [published(), agentVersion(AGENT_BUNDLE_ID)],
          bundles: [{id: AGENT_BUNDLE_ID, applicationKey: 'application-key'}],
        })

        const sets = computeSets({meta, current: [], t, variantsEnabled: true, placement})

        expect(sets.map(({key}) => key)).toEqual(['studio:content-agent', 'published'])
      })
    })
  })
})
