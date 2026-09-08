import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {getDocumentVersionStatusTimestampKey} from '../getDocumentVersionStatusTimestampKey'

const CREATED_AT = '2026-01-01T00:00:00.000Z'
const UPDATED_AT = '2026-01-02T00:00:00.000Z'

function createVersion({
  id,
  bundleId,
  createdAt = CREATED_AT,
  updatedAt = UPDATED_AT,
  releaseRef,
  variantRef,
}: {
  id: string
  bundleId?: string
  createdAt?: string
  updatedAt?: string
  releaseRef?: string
  variantRef?: string
}): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: `${id}-rev`,
    _createdAt: createdAt,
    _updatedAt: updatedAt,
    _type: 'article',
    _system: {
      bundleId,
      group: {_ref: 'article-1', _weak: true},
      release: releaseRef ? {_ref: releaseRef, _weak: true} : undefined,
      variant: variantRef ? {_ref: variantRef, _weak: true} : undefined,
    },
  }
}

describe('getDocumentVersionStatusTimestampKey', () => {
  it('uses Published for a published document that is not live-edit', () => {
    expect(getDocumentVersionStatusTimestampKey(createVersion({id: 'article-1'}), false)).toBe(
      'document-status.published-at',
    )
  })

  it('uses Published for a published document even when it has never been edited', () => {
    expect(
      getDocumentVersionStatusTimestampKey(
        createVersion({id: 'article-1', createdAt: CREATED_AT, updatedAt: CREATED_AT}),
        false,
      ),
    ).toBe('document-status.published-at')
  })

  it('uses Published for a published variant that is not live-edit', () => {
    expect(
      getDocumentVersionStatusTimestampKey(
        createVersion({id: 'published.scope.article-1', variantRef: '_.variants.a'}),
        false,
      ),
    ).toBe('document-status.published-at')
  })

  it('uses Edited for a live-edit published document that has been updated', () => {
    expect(getDocumentVersionStatusTimestampKey(createVersion({id: 'article-1'}), true)).toBe(
      'document-status.edited',
    )
  })

  it('uses Created for a live-edit published document that has never been edited', () => {
    expect(
      getDocumentVersionStatusTimestampKey(
        createVersion({id: 'article-1', createdAt: CREATED_AT, updatedAt: CREATED_AT}),
        true,
      ),
    ).toBe('document-status.created')
  })

  it('uses Created for a draft that has never been edited', () => {
    expect(
      getDocumentVersionStatusTimestampKey(
        createVersion({
          id: 'drafts.article-1',
          bundleId: 'drafts',
          createdAt: CREATED_AT,
          updatedAt: CREATED_AT,
        }),
        false,
      ),
    ).toBe('document-status.created')
  })

  it('uses Edited for a draft that has been updated', () => {
    expect(
      getDocumentVersionStatusTimestampKey(
        createVersion({id: 'drafts.article-1', bundleId: 'drafts'}),
        false,
      ),
    ).toBe('document-status.edited')
  })

  it('uses Created for a release version that has never been edited', () => {
    expect(
      getDocumentVersionStatusTimestampKey(
        createVersion({
          id: 'versions.rSummer.article-1',
          bundleId: 'rSummer',
          createdAt: CREATED_AT,
          updatedAt: CREATED_AT,
          releaseRef: '_.releases.rSummer',
        }),
        false,
      ),
    ).toBe('document-status.created')
  })

  it('uses Edited for a release version that has been updated', () => {
    expect(
      getDocumentVersionStatusTimestampKey(
        createVersion({
          id: 'versions.rSummer.article-1',
          bundleId: 'rSummer',
          releaseRef: '_.releases.rSummer',
        }),
        false,
      ),
    ).toBe('document-status.edited')
  })
})
