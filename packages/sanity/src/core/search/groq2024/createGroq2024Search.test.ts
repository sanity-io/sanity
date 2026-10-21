import {ClientError, type SanityClient} from '@sanity/client'
import {type SchemaType} from '@sanity/types'
import {lastValueFrom, of, throwError} from 'rxjs'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {createSchema} from '../../schema/createSchema'
import {getSearchableTypes} from '../common/getSearchableTypes'
import {createGroq2024Search} from './createGroq2024Search'

const schema = createSchema({
  name: 'test',
  types: [
    {
      name: 'author',
      type: 'document',
      fields: [{name: 'name', type: 'string'}],
    },
    {
      name: 'book',
      type: 'document',
      preview: {select: {title: 'title', subtitle: 'author.name'}},
      fields: [
        {name: 'title', type: 'string'},
        {name: 'author', type: 'reference', to: [{type: 'author'}]},
      ],
    },
    {
      name: 'note',
      type: 'document',
      preview: {select: {title: 'title'}},
      fields: [{name: 'title', type: 'string'}],
    },
  ],
})

function typeByName(name: string): SchemaType {
  const type = getSearchableTypes(schema).find((candidate) => candidate.name === name)
  if (!type) {
    throw new Error(`Type "${name}" not searchable in test schema`)
  }
  return type
}

function createMockClient(fetch: Mock): SanityClient {
  return {observable: {fetch}} as unknown as SanityClient
}

function unsupportedScoreExpressionError() {
  return new ClientError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    headers: {},
    body: {
      error: {
        type: 'validationError',
        description:
          'score() function received unexpected expression: analytics.pageName match text::query($__query)',
      },
    },
    url: 'https://api.sanity.io/v2024-01-01/data/query/test',
    method: 'GET',
  })
}

describe('createGroq2024Search two-phase orchestration', () => {
  it('resolves reference ids then runs the main search with normalised published ids', async () => {
    const fetch = vi
      .fn()
      .mockReturnValueOnce(of(['drafts.author-1', 'author-1', 'versions.rABC.author-2']))
      .mockReturnValueOnce(of([{_id: 'book-1', _type: 'book'}]))
    const search = createGroq2024Search([typeByName('book')], createMockClient(fetch), {})

    const result = await lastValueFrom(search({query: 'jane', types: [typeByName('book')]}))

    expect(fetch).toHaveBeenCalledTimes(2)
    const [resolveQuery] = fetch.mock.calls[0]
    expect(resolveQuery).toContain('[0...1000]._id')
    const [, mainParams] = fetch.mock.calls[1]
    expect(mainParams.__refIds).toEqual(['author-1', 'author-2'])
    expect(result.hits).toEqual([{hit: {_id: 'book-1', _type: 'book'}}])
  })

  it('skips phase one when no searched type has a reference-preview path', async () => {
    const fetch = vi.fn().mockReturnValue(of([]))
    const search = createGroq2024Search([typeByName('note')], createMockClient(fetch), {})

    await lastValueFrom(search({query: 'jane', types: [typeByName('note')]}))

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][1].__refIds).toBeUndefined()
  })

  it('skips phase one when there is no search term', async () => {
    const fetch = vi.fn().mockReturnValue(of([]))
    const search = createGroq2024Search([typeByName('book')], createMockClient(fetch), {})

    await lastValueFrom(search({query: '', types: [typeByName('book')]}))

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('excludes the overfetched element when no limit is passed', async () => {
    const overfetched = Array.from({length: 1001}, (_unused, index) => ({
      _id: `note-${index}`,
      _type: 'note',
    }))
    const fetch = vi.fn().mockReturnValue(of(overfetched))
    const search = createGroq2024Search([typeByName('note')], createMockClient(fetch), {})

    const result = await lastValueFrom(search({query: 'jane', types: [typeByName('note')]}))

    expect(result.hits).toHaveLength(1000)
  })

  it('falls back to a plain search when phase one fails', async () => {
    const fetch = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('reference resolution failed')))
      .mockReturnValueOnce(of([{_id: 'book-1', _type: 'book'}]))
    const search = createGroq2024Search([typeByName('book')], createMockClient(fetch), {})

    const result = await lastValueFrom(search({query: 'jane', types: [typeByName('book')]}))

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[1][1].__refIds).toBeUndefined()
    expect(result.hits).toEqual([{hit: {_id: 'book-1', _type: 'book'}}])
  })

  // https://linear.app/sanity/issue/SAPP-4706
  describe('unsupported score() expression fallback (partial indexing)', () => {
    // `book` has a reference-traversing preview path, so phase one runs first (call 1) ahead
    // of the main search (calls 2+) — matching the two-phase orchestration exercised above.
    it('retries once without scoring when score() rejects a boosted path', async () => {
      const fetch = vi
        .fn()
        .mockReturnValueOnce(of([])) // phase one: no reference ids resolved
        .mockReturnValueOnce(throwError(() => unsupportedScoreExpressionError())) // scored attempt
        .mockReturnValueOnce(of([{_id: 'book-1', _type: 'book'}])) // retried, unscored attempt

      const search = createGroq2024Search([typeByName('book')], createMockClient(fetch), {})

      const result = await lastValueFrom(search({query: 'jane', types: [typeByName('book')]}))

      expect(fetch).toHaveBeenCalledTimes(3)
      const [scoredQuery] = fetch.mock.calls[1]
      const [unscoredQuery] = fetch.mock.calls[2]
      expect(scoredQuery).toContain('score(')
      expect(unscoredQuery).not.toContain('score(')
      expect(result.hits).toEqual([{hit: {_id: 'book-1', _type: 'book'}}])
    })

    it('does not retry a second time if the unscored attempt also fails that way', async () => {
      const fetch = vi
        .fn()
        .mockReturnValueOnce(of([]))
        .mockReturnValueOnce(throwError(() => unsupportedScoreExpressionError()))
        .mockReturnValueOnce(throwError(() => unsupportedScoreExpressionError()))

      const search = createGroq2024Search([typeByName('book')], createMockClient(fetch), {})

      await expect(
        lastValueFrom(search({query: 'jane', types: [typeByName('book')]})),
      ).rejects.toThrow('score() function received unexpected expression')
      expect(fetch).toHaveBeenCalledTimes(3)
    })

    it('rethrows unrelated errors without retrying', async () => {
      const fetch = vi
        .fn()
        .mockReturnValueOnce(of([]))
        .mockReturnValueOnce(throwError(() => new Error('network error')))

      const search = createGroq2024Search([typeByName('book')], createMockClient(fetch), {})

      await expect(
        lastValueFrom(search({query: 'jane', types: [typeByName('book')]})),
      ).rejects.toThrow('network error')
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })
})
