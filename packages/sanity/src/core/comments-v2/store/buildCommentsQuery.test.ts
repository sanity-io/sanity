import {describe, expect, test} from 'vitest'

import {buildCommentsQuery} from './buildCommentsQuery'

const gdr = 'dataset:project.production:doc-1'

describe('buildCommentsQuery', () => {
  test('loads draft and published comments for a draft id', () => {
    const {query, params} = buildCommentsQuery({
      gdr,
      versionId: 'drafts.doc-1',
    })

    expect(params).toEqual({
      gdr,
      publishedDocumentId: 'doc-1',
      draftDocumentId: 'drafts.doc-1',
    })
    expect(query).toContain('target.sourceDocumentId in [$publishedDocumentId, $draftDocumentId]')
    expect(query).toContain('target.document._ref == $gdr')
    expect(query).toContain('_type == "sanity.comment"')
    expect(query).toContain('order(_createdAt desc)')
  })

  test('loads draft and published comments for a published id', () => {
    const {query, params} = buildCommentsQuery({
      gdr,
      versionId: 'doc-1',
    })

    expect(params).toEqual({
      gdr,
      publishedDocumentId: 'doc-1',
      draftDocumentId: 'drafts.doc-1',
    })
    expect(query).toContain('target.sourceDocumentId in [$publishedDocumentId, $draftDocumentId]')
  })

  test('loads only the matching source for a version id', () => {
    const versionId = 'versions.rSummer.doc-1'
    const {query, params} = buildCommentsQuery({gdr, versionId})

    expect(params).toEqual({gdr, versionId})
    expect(query).toContain('target.sourceDocumentId == $versionId')
    expect(query).not.toContain('$publishedDocumentId')
  })
})
