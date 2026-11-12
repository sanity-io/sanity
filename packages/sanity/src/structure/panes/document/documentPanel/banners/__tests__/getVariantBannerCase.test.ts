import {type SystemVariant, type TargetDocumentState, type VersionInfoDocumentStub} from 'sanity'
import {describe, expect, it} from 'vitest'

import {
  getVariantBannerCase,
  type VariantBannerCase,
  type VariantBannerPerspective,
} from '../getVariantBannerCase'

const variant = {
  _id: '_.variants.alpha',
  _type: 'system.variant',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev',
  conditions: {audience: 'alpha'},
  priority: 1,
  metadata: {title: 'Alpha', description: []},
} as unknown as SystemVariant

const stub = (id: string): VersionInfoDocumentStub =>
  ({
    _id: id,
    _rev: 'r',
    _type: 'article',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
  }) as VersionInfoDocumentStub

/** Which copies of the selected variant exist. */
type Copies = {published?: boolean; draft?: boolean; release?: boolean}

const siblings = (copies: Copies) => ({
  published: copies.published ? stub('versions.pub-scope.doc') : undefined,
  draft: copies.draft ? stub('versions.draft-scope.doc') : undefined,
  version: copies.release ? stub('versions.rel-scope.doc') : undefined,
})

const ready = (copies: Copies): TargetDocumentState => ({
  status: 'ready',
  targetDocument: stub('versions.x.doc'),
  scopeId: 'x',
  variant,
  siblings: siblings(copies),
})

const missing = (copies: Copies, creatable = false): TargetDocumentState => ({
  status: 'variant-missing',
  variant,
  bundle: 'drafts',
  siblings: siblings(copies),
  ...(creatable ? {creatableTarget: {id: 'versions.draft-scope.doc', scopeId: 'draft-scope'}} : {}),
})

const NONE: VariantBannerCase = {kind: 'none'}

const rows: Array<{
  name: string
  perspective: VariantBannerPerspective
  state: TargetDocumentState
  hasDrafts?: boolean
  expected: VariantBannerCase
}> = [
  // Resolving and "no variant selected" (ready, no variant) never show a variant banner.
  {name: 'resolving', perspective: 'drafts', state: {status: 'resolving'}, expected: NONE},
  {name: 'no variant selected', perspective: 'drafts', state: ready({}), expected: NONE},

  // Drafts
  {
    name: 'drafts: variant has a draft',
    perspective: 'drafts',
    state: ready({draft: true}),
    expected: NONE,
  },
  {
    name: 'drafts: variant published, no draft (creatable by typing)',
    perspective: 'drafts',
    state: missing({published: true}, true),
    expected: NONE,
  },
  {
    name: 'drafts: variant published, no draft, draft id not advertised',
    perspective: 'drafts',
    state: missing({published: true}),
    expected: {kind: 'create', perspective: 'drafts'},
  },
  {
    name: 'drafts: variant has no version at all',
    perspective: 'drafts',
    state: missing({}),
    expected: {kind: 'create', perspective: 'drafts'},
  },
  {
    name: 'drafts: variant only in a release',
    perspective: 'drafts',
    state: missing({release: true}),
    expected: {kind: 'create', perspective: 'drafts'},
  },
  {
    name: 'drafts, live edit: variant has no version',
    perspective: 'drafts',
    state: missing({}),
    hasDrafts: false,
    expected: {kind: 'create', perspective: 'published'},
  },

  // Published
  {
    name: 'published: variant is published',
    perspective: 'published',
    state: ready({published: true}),
    expected: NONE,
  },
  {
    name: 'published: variant has a draft only',
    perspective: 'published',
    state: missing({draft: true}),
    expected: {kind: 'switch-to-drafts'},
  },
  {
    name: 'published: variant has a draft and a release copy',
    perspective: 'published',
    state: missing({draft: true, release: true}),
    expected: {kind: 'switch-to-drafts'},
  },
  {
    name: 'published: variant has no version at all',
    perspective: 'published',
    state: missing({}),
    expected: {kind: 'create-in-drafts'},
  },
  {
    name: 'published: variant only in a release',
    perspective: 'published',
    state: missing({release: true}),
    expected: {kind: 'create-in-drafts'},
  },
  {
    name: 'published, live edit or drafts off: no version',
    perspective: 'published',
    state: missing({}),
    hasDrafts: false,
    expected: {kind: 'create', perspective: 'published'},
  },
  {
    name: 'published, live edit or drafts off: a stray draft is ignored',
    perspective: 'published',
    state: missing({draft: true}),
    hasDrafts: false,
    expected: {kind: 'create', perspective: 'published'},
  },

  // Open release
  {
    name: 'release: variant is in the release',
    perspective: 'release',
    state: ready({release: true}),
    expected: NONE,
  },
  {
    name: 'release: variant has no version at all',
    perspective: 'release',
    state: missing({}),
    expected: {kind: 'create', perspective: 'release'},
  },
  {
    name: 'release: variant published and drafted, not in the release',
    perspective: 'release',
    state: missing({published: true, draft: true}),
    expected: {kind: 'create', perspective: 'release'},
  },

  // Scheduled (locked) release
  {
    name: 'locked release: variant is in the release',
    perspective: 'locked-release',
    state: ready({release: true}),
    expected: NONE,
  },
  {
    name: 'locked release: variant has no version',
    perspective: 'locked-release',
    state: missing({}),
    expected: {kind: 'locked-release'},
  },
  {
    name: 'locked release: variant published and drafted, not in the release',
    perspective: 'locked-release',
    state: missing({published: true, draft: true}),
    expected: {kind: 'locked-release'},
  },
]

const perspectives: VariantBannerPerspective[] = [
  'drafts',
  'published',
  'release',
  'locked-release',
]

describe('getVariantBannerCase', () => {
  it.each(rows)('$name', ({perspective, state, hasDrafts = true, expected}) => {
    expect(getVariantBannerCase({targetDocumentState: state, perspective, hasDrafts})).toEqual(
      expected,
    )
  })

  it.each(perspectives)(
    'shows the definition-not-found banner in %s, whatever the drafts setting',
    (perspective) => {
      for (const hasDrafts of [true, false]) {
        expect(
          getVariantBannerCase({
            targetDocumentState: {
              status: 'variant-definition-document-not-found',
              requestedVariantName: 'gone',
            },
            perspective,
            hasDrafts,
          }),
        ).toEqual({kind: 'definition-not-found', requestedVariantName: 'gone'})
      }
    },
  )
})
