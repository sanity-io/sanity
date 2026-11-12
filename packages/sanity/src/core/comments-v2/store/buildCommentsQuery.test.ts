import {describe, expect, test} from 'vitest'

import {comment} from './__fixtures__/comment.fixture'
import {buildCommentsQuery, matchesCommentsQuery} from './buildCommentsQuery'

const gdr = 'dataset:project.production:doc-1'

describe('buildCommentsQuery', () => {
  test('loads draft and published field comments for a draft id', () => {
    const {query, params} = buildCommentsQuery({
      gdr,
      versionId: 'drafts.doc-1',
      type: 'field',
    })

    expect(params).toEqual({
      gdr,
      publishedDocumentId: 'doc-1',
      draftDocumentId: 'drafts.doc-1',
    })
    expect(query).toContain('target.sourceDocumentId in [$publishedDocumentId, $draftDocumentId]')
    expect(query).toContain('target.document._ref == $gdr')
    expect(query).toContain('_type == "sanity.comment"')
    expect(query).toContain('defined(target.path.field)')
    expect(query).toContain('order(_createdAt desc)')
  })

  test('loads draft and published field comments for a published id', () => {
    const {query, params} = buildCommentsQuery({
      gdr,
      versionId: 'doc-1',
      type: 'field',
    })

    expect(params).toEqual({
      gdr,
      publishedDocumentId: 'doc-1',
      draftDocumentId: 'drafts.doc-1',
    })
    expect(query).toContain('target.sourceDocumentId in [$publishedDocumentId, $draftDocumentId]')
    expect(query).toContain('defined(target.path.field)')
  })

  test('loads only the matching source for a version id', () => {
    const versionId = 'versions.rSummer.doc-1'
    const {query, params} = buildCommentsQuery({gdr, versionId, type: 'field'})

    expect(params).toEqual({gdr, versionId})
    expect(query).toContain('target.sourceDocumentId == $versionId')
    expect(query).not.toContain('$publishedDocumentId')
    expect(query).toContain('defined(target.path.field)')
  })

  test('allows path-less task comments', () => {
    const {query} = buildCommentsQuery({
      gdr,
      versionId: 'task-1',
      type: 'task',
    })

    expect(query).not.toContain('defined(target.path.field)')
  })
})

describe('matchesCommentsQuery', () => {
  const docGdr = 'dataset:abc.production:doc-1'

  test('matches draft and published field comments for a draft or published id', () => {
    for (const versionId of ['drafts.doc-1', 'doc-1']) {
      const options = {gdr: docGdr, versionId, type: 'field' as const}
      expect(matchesCommentsQuery(comment('c1', 'doc-1'), options)).toBe(true)
      expect(matchesCommentsQuery(comment('c2', 'drafts.doc-1'), options)).toBe(true)
      expect(matchesCommentsQuery(comment('c3', 'versions.rSummer.doc-1'), options)).toBe(false)
    }
  })

  test('matches only the comments on the exact version for a version id', () => {
    const options = {gdr: docGdr, versionId: 'versions.rSummer.doc-1', type: 'field' as const}

    expect(matchesCommentsQuery(comment('c1', 'versions.rSummer.doc-1'), options)).toBe(true)
    expect(matchesCommentsQuery(comment('c2', 'versions.rWinter.doc-1'), options)).toBe(false)
    expect(matchesCommentsQuery(comment('c3', 'drafts.doc-1'), options)).toBe(false)
  })

  test('requires a field path for field comments, not for task comments', () => {
    const pathless = comment('c1', 'doc-1', {field: null})

    expect(matchesCommentsQuery(pathless, {gdr: docGdr, versionId: 'doc-1', type: 'field'})).toBe(
      false,
    )
    expect(matchesCommentsQuery(pathless, {gdr: docGdr, versionId: 'doc-1', type: 'task'})).toBe(
      true,
    )
  })

  test('leaves out the comments of other documents and resources', () => {
    const options = {gdr: docGdr, versionId: 'doc-1', type: 'field' as const}

    expect(matchesCommentsQuery(comment('c1', 'doc-2'), options)).toBe(false)
    expect(matchesCommentsQuery(comment('c2', 'doc-1'), {...options, gdr: null})).toBe(false)
  })
})
