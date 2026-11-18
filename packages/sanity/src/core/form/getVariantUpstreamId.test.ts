import {describe, expect, it} from 'vitest'

import {type TargetDocumentState} from '../hooks/useTargetDocumentState'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {type SystemVariant} from '../variants/types'
import {getVariantUpstreamId} from './getVariantUpstreamId'

const STUDENTS: SystemVariant = {
  _id: '_.variants.students',
  _type: 'system.variant',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  conditions: {audience: 'students'},
  priority: 0,
}

function stub(id: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: 'book',
    _system: {group: {_ref: 'book', _weak: true}},
  }
}

const VARIANT_PUBLISHED = stub('versions.p-students.book')
const VARIANT_DRAFT = stub('versions.d-students.book')

function ready(
  siblings: Partial<{published: VersionInfoDocumentStub; draft: VersionInfoDocumentStub}>,
  variant: SystemVariant | null = STUDENTS,
): TargetDocumentState {
  return {
    status: 'ready',
    targetDocument: siblings.draft ?? siblings.published,
    scopeId: undefined,
    variant: variant ?? undefined,
    siblings: {published: siblings.published, draft: siblings.draft, version: undefined},
  }
}

describe('getVariantUpstreamId', () => {
  it("compares a variant's draft with the variant's published version", () => {
    expect(
      getVariantUpstreamId(
        ready({published: VARIANT_PUBLISHED, draft: VARIANT_DRAFT}),
        VARIANT_DRAFT._id,
      ),
    ).toBe(VARIANT_PUBLISHED._id)
  })

  it('compares a never-published variant draft with nothing', () => {
    expect(getVariantUpstreamId(ready({draft: VARIANT_DRAFT}), VARIANT_DRAFT._id)).toBeNull()
  })

  it("compares a variant's published version with nothing", () => {
    expect(
      getVariantUpstreamId(ready({published: VARIANT_PUBLISHED}), VARIANT_PUBLISHED._id),
    ).toBeNull()
  })

  it('compares nothing while Drafts shows the published version until the first edit', () => {
    const state: TargetDocumentState = {
      status: 'variant-missing',
      variant: STUDENTS,
      bundle: 'drafts',
      siblings: {published: VARIANT_PUBLISHED, draft: undefined, version: undefined},
      creatableTarget: {id: VARIANT_DRAFT._id, scopeId: 'd-students'},
    }
    expect(getVariantUpstreamId(state, VARIANT_PUBLISHED._id)).toBeNull()
  })

  it('leaves documents with no variant selected to the id stack', () => {
    expect(
      getVariantUpstreamId(
        ready({published: stub('book'), draft: stub('drafts.book')}, null),
        'drafts.book',
      ),
    ).toBeUndefined()
  })

  it('leaves a variant version that is neither its draft nor its published to the id stack', () => {
    expect(
      getVariantUpstreamId(ready({published: VARIANT_PUBLISHED}), 'versions.rWinter-students.book'),
    ).toBeUndefined()
  })

  it('leaves a resolving target to the id stack', () => {
    expect(getVariantUpstreamId({status: 'resolving'}, VARIANT_DRAFT._id)).toBeUndefined()
  })
})
