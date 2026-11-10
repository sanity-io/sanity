import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {type VariantId} from '../../variants/types'
import {buildInventoryIndex, toVersionStub} from '../buildInventoryIndex'
import {cellState, definitionLens, documentLens, documentSummary} from '../lenses'
import {type VersionStub} from '../types'

const GERMAN = '_.variants.german' as VariantId
const STUDENTS = '_.variants.students' as VariantId

function release(
  id: string,
  releaseType: 'asap' | 'scheduled' | 'undecided',
  extra: {createdAt?: string; publishAt?: string} = {},
): ReleaseDocument {
  return {
    _id: `_.releases.${id}`,
    _type: 'system.release',
    _createdAt: extra.createdAt ?? '2026-11-01T00:00:00Z',
    _updatedAt: extra.createdAt ?? '2026-11-01T00:00:00Z',
    _rev: 'rev',
    name: id,
    state: 'active',
    publishAt: extra.publishAt,
    metadata: {title: id, releaseType, intendedPublishAt: extra.publishAt},
  } as ReleaseDocument
}

const releases = new Map(
  [
    release('rUndecided', 'undecided'),
    release('rLate', 'scheduled', {publishAt: '2026-12-20T00:00:00Z'}),
    release('rEarly', 'scheduled', {publishAt: '2026-12-01T00:00:00Z'}),
    release('rAsap', 'asap'),
  ].map((doc) => [doc._id, doc]),
)

function stub(
  overrides: Partial<VersionStub> & Pick<VersionStub, '_id' | 'groupId' | 'kind'>,
): VersionStub {
  return {
    _type: 'product',
    _updatedAt: '2026-11-05T00:00:00Z',
    variantId: undefined,
    bundle:
      overrides.kind === 'published'
        ? 'published'
        : overrides.kind === 'draft'
          ? 'drafts'
          : 'unknown',
    goingToUnpublish: false,
    ...overrides,
  }
}

// One fixture shared by the lenses: three products, German and Students definitions.
const fixture: VersionStub[] = [
  stub({
    _id: 'versions.rUndecided.jacket',
    groupId: 'jacket',
    kind: 'release',
    bundle: '_.releases.rUndecided',
  }),
  stub({
    _id: 'versions.rAsap.jacket',
    groupId: 'jacket',
    kind: 'release',
    bundle: '_.releases.rAsap',
  }),
  stub({_id: 'drafts.jacket', groupId: 'jacket', kind: 'draft'}),
  stub({_id: 'jacket', groupId: 'jacket', kind: 'published'}),
  stub({
    _id: 'versions.scopeDe.jacket',
    groupId: 'jacket',
    kind: 'draft',
    bundle: 'drafts',
    variantId: GERMAN,
    _updatedAt: '2026-11-08T00:00:00Z',
  }),
  stub({_id: 'shell', groupId: 'shell', kind: 'published'}),
  stub({
    _id: 'published.scopeDe.shell',
    groupId: 'shell',
    kind: 'published',
    variantId: GERMAN,
  }),
  stub({
    _id: 'versions.rEarly.scopeSt.shell',
    groupId: 'shell',
    kind: 'release',
    bundle: '_.releases.rEarly',
    variantId: STUDENTS,
    _updatedAt: '2026-11-09T00:00:00Z',
  }),
  stub({_id: 'cap', groupId: 'cap', kind: 'published'}),
]

const index = buildInventoryIndex({versions: fixture, releases})

describe('toVersionStub', () => {
  it('groups by _system.group and reads the variant and release from _system', () => {
    const document: VersionInfoDocumentStub = {
      _id: 'versions.rAsap.scopeDe.jacket',
      _rev: 'rev',
      _type: 'product',
      _createdAt: '2026-11-01T00:00:00Z',
      _updatedAt: '2026-11-02T00:00:00Z',
      _system: {
        group: {_ref: 'jacket', _weak: true},
        bundleId: 'rAsap',
        release: {_ref: '_.releases.rAsap', _weak: true},
        variants: [{_ref: GERMAN, _key: 'k'}],
        delete: true,
      },
    }

    expect(toVersionStub(document)).toEqual({
      _id: 'versions.rAsap.scopeDe.jacket',
      _type: 'product',
      _updatedAt: '2026-11-02T00:00:00Z',
      groupId: 'jacket',
      variantId: GERMAN,
      kind: 'release',
      bundle: '_.releases.rAsap',
      goingToUnpublish: true,
    })
  })
})

describe('buildInventoryIndex', () => {
  it('orders versions Published, Drafts, then releases by when they go out', () => {
    expect(index.byGroup.get('jacket')?.map(({_id}) => _id)).toEqual([
      'jacket',
      'drafts.jacket',
      'versions.scopeDe.jacket',
      'versions.rAsap.jacket',
      'versions.rUndecided.jacket',
    ])
  })

  it('puts scheduled releases by date between ASAP and undecided', () => {
    const ordered = buildInventoryIndex({
      versions: [
        stub({_id: 'u', groupId: 'g', kind: 'release', bundle: '_.releases.rUndecided'}),
        stub({_id: 'late', groupId: 'g', kind: 'release', bundle: '_.releases.rLate'}),
        stub({_id: 'early', groupId: 'g', kind: 'release', bundle: '_.releases.rEarly'}),
        stub({_id: 'asap', groupId: 'g', kind: 'release', bundle: '_.releases.rAsap'}),
        stub({_id: 'missing', groupId: 'g', kind: 'release', bundle: '_.releases.rMissing'}),
      ],
      releases,
    })

    expect(ordered.versions.map(({_id}) => _id)).toEqual(['asap', 'early', 'late', 'u', 'missing'])
  })

  describe('scheduled drafts', () => {
    const scheduledDraft = {
      ...release('rScheduledDraft', 'scheduled', {publishAt: '2026-12-10T00:00:00Z'}),
      metadata: {
        title: 'rScheduledDraft',
        releaseType: 'scheduled',
        intendedPublishAt: '2026-12-10T00:00:00Z',
        cardinality: 'one',
      },
    } as ReleaseDocument
    const withScheduledDraft = new Map([...releases, [scheduledDraft._id, scheduledDraft]])
    const versions = [
      stub({_id: 'u', groupId: 'g', kind: 'release', bundle: '_.releases.rUndecided'}),
      stub({_id: 'sd', groupId: 'g', kind: 'release', bundle: '_.releases.rScheduledDraft'}),
      stub({_id: 'late', groupId: 'g', kind: 'release', bundle: '_.releases.rLate'}),
      stub({_id: 'early', groupId: 'g', kind: 'release', bundle: '_.releases.rEarly'}),
    ]

    it('sorts them among the scheduled releases by date by default', () => {
      const ordered = buildInventoryIndex({versions, releases: withScheduledDraft})
      expect(ordered.versions.map(({_id}) => _id)).toEqual(['early', 'sd', 'late', 'u'])
    })

    it('moves them after every other release with afterReleases', () => {
      const ordered = buildInventoryIndex({
        versions,
        releases: withScheduledDraft,
        scheduledDrafts: 'afterReleases',
      })
      expect(ordered.versions.map(({_id}) => _id)).toEqual(['early', 'late', 'u', 'sd'])
    })
  })

  it('records which documents have a version for each definition', () => {
    expect([...(index.groupsByVariant.get(GERMAN) ?? [])]).toEqual(['shell', 'jacket'])
    expect([...(index.groupsByVariant.get(STUDENTS) ?? [])]).toEqual(['shell'])
  })
})

describe('cellState', () => {
  it('prefers published over draft over release, and reports absent', () => {
    expect(cellState(index, 'shell', GERMAN)).toBe('published')
    expect(cellState(index, 'jacket', GERMAN)).toBe('draft')
    expect(cellState(index, 'shell', STUDENTS)).toBe('release')
    expect(cellState(index, 'cap', GERMAN)).toBe('absent')
  })
})

describe('documentSummary', () => {
  it('lists Default first, then definitions by their latest edit', () => {
    const {lines} = documentSummary(index, 'shell')

    expect(lines.map(({variantId}) => variantId)).toEqual([undefined, STUDENTS, GERMAN])
    expect(lines[1]?.latest._id).toBe('versions.rEarly.scopeSt.shell')
  })

  it('cuts at maxLines and counts the versions it hides', () => {
    const {lines, hiddenVersionCount} = documentSummary(index, 'shell', {maxLines: 1})

    expect(lines).toHaveLength(1)
    expect(hiddenVersionCount).toBe(2)
  })
})

describe('documentLens', () => {
  it('is the per-document inventory when given one document', () => {
    expect(documentLens(index, {groupIds: ['cap']}).map(({_id}) => _id)).toEqual(['cap'])
  })

  it('lists every stored version across documents, in the shared order', () => {
    expect(documentLens(index)).toHaveLength(fixture.length)
    expect(documentLens(index)[0]?.kind).toBe('published')
  })
})

describe('definitionLens', () => {
  it('splits a universe into documents with and without a version', () => {
    const {present, absent} = definitionLens(index, GERMAN, ['jacket', 'shell', 'cap'])

    expect(present).toEqual([
      {groupId: 'shell', state: 'published'},
      {groupId: 'jacket', state: 'draft'},
    ])
    expect(absent).toEqual([{groupId: 'cap', state: 'absent'}])
  })

  it('keeps present documents that fall outside the universe', () => {
    const {present, absent} = definitionLens(index, STUDENTS, ['cap'])

    expect(present).toEqual([{groupId: 'shell', state: 'release'}])
    expect(absent).toEqual([{groupId: 'cap', state: 'absent'}])
  })

  it('leaves out documents whose only version for the definition is an agent version', () => {
    const withAgent = buildInventoryIndex({
      versions: [
        ...fixture,
        stub({
          _id: 'versions.agent-proposal.cap',
          groupId: 'cap',
          kind: 'agent',
          variantId: GERMAN,
          bundle: 'agent-proposal',
        }),
      ],
      releases,
    })

    const {present, absent} = definitionLens(withAgent, GERMAN, ['jacket', 'shell', 'cap'])

    expect(present.map(({groupId}) => groupId)).not.toContain('cap')
    expect(absent).toEqual([{groupId: 'cap', state: 'absent'}])
  })
})
