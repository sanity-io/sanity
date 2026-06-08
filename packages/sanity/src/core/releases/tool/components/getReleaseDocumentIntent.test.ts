import {describe, expect, it} from 'vitest'

import {getPublishedId} from '../../../util/draftUtils'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseDocumentIntent} from './getReleaseDocumentIntent'

const RELEASE_ID = '_.releases.rTest'
const RELEASE_NAME = getReleaseIdFromReleaseDocumentId(RELEASE_ID)
const DOC_ID = 'versions.rTest.doc1'
const PUBLISHED_ID = getPublishedId(DOC_ID)

const base = {documentId: DOC_ID, documentTypeName: 'post', releaseId: RELEASE_ID}

describe('getReleaseDocumentIntent', () => {
  it('targets the release perspective for an active release', () => {
    const {params, searchParams} = getReleaseDocumentIntent({...base})
    expect(params).toEqual({id: PUBLISHED_ID, type: 'post'})
    expect(searchParams).toEqual([['perspective', RELEASE_NAME]])
  })

  it('includes the focus path when provided', () => {
    const {params} = getReleaseDocumentIntent({...base, path: 'body[_key=="abc"].title'})
    expect(params).toMatchObject({
      id: PUBLISHED_ID,
      type: 'post',
      path: 'body[_key=="abc"].title',
    })
  })

  it('omits an empty focus path', () => {
    const {params} = getReleaseDocumentIntent({...base, path: ''})
    expect(params).not.toHaveProperty('path')
  })

  it('uses the published view for a published release', () => {
    const {params, searchParams} = getReleaseDocumentIntent({...base, releaseState: 'published'})
    expect(params).toMatchObject({
      rev: `@release:${RELEASE_NAME}`,
      inspect: 'sanity/structure/history',
    })
    expect(searchParams).toEqual([['perspective', 'published']])
  })

  it('fakes a valid release for an archived release (no perspective search param)', () => {
    const {params, searchParams} = getReleaseDocumentIntent({
      ...base,
      releaseState: 'archived',
      documentRevision: 'rev1',
    })
    expect(params).toMatchObject({
      rev: '@lastEdited',
      inspect: 'sanity/structure/history',
      historyVersion: RELEASE_NAME,
      archivedRelease: 'true',
    })
    expect(searchParams).toBeUndefined()
  })

  it('uses scheduledDraft (no perspective search param) for a cardinality-one release', () => {
    const {params, searchParams} = getReleaseDocumentIntent({
      ...base,
      isCardinalityOneRelease: true,
    })
    expect(params).toMatchObject({scheduledDraft: RELEASE_NAME})
    expect(searchParams).toBeUndefined()
  })
})
