import {describe, expect, it} from 'vitest'

import {encodeQueryString} from '../../util/encodeQueryString'
import {describeRequestUrl, formatQueryForDiff, getRequestChanges} from './requestChanges'

const BASE = 'https://abc123.api.sanity.io/v2025-02-19/data/query/production'

function url(
  query: string,
  params: Record<string, unknown> = {},
  options: Record<string, string | string[]> = {},
  base = BASE,
) {
  return `${base}${encodeQueryString(query, params, options)}`
}

describe('describeRequestUrl', () => {
  it('keeps the path and the options, one per line, without the query, params or source map', () => {
    expect(
      describeRequestUrl(
        url(
          '*[_type == $type]',
          {type: 'author'},
          {perspective: ['rSummer', 'drafts'], variant: 'v1', resultSourceMap: 'true'},
        ),
      ),
    ).toBe(`${BASE}\nperspective=rSummer,drafts\nvariant=v1\n`)
  })

  it('falls back to the text it was given when it is not a URL', () => {
    expect(describeRequestUrl('')).toBe('\n')
  })
})

describe('formatQueryForDiff', () => {
  it('breaks every group: attributes, conditions and pipes each on a line of their own', async () => {
    expect(
      await formatQueryForDiff(
        '*[_type == "post" && defined(slug.current)] | order(_createdAt desc)[0...$limit]{_id, author->{name}}',
      ),
    ).toBe(
      [
        '*[_type == "post"',
        '  && defined(slug.current)]',
        '  | order(_createdAt desc)[0...$limit] {',
        '  _id,',
        '  author-> {',
        '    name',
        '  }',
        '}',
        '',
      ].join('\n'),
    )
  })

  it('keeps comments', async () => {
    expect(await formatQueryForDiff('// authors\n*[_type == "author"]{name}')).toBe(
      '// authors\n*[_type == "author"] {\n  name\n}\n',
    )
  })

  it('leaves a query that does not parse as it was typed', async () => {
    expect(await formatQueryForDiff('*[_type ==')).toBe('*[_type ==\n')
  })
})

describe('getRequestChanges', () => {
  const request = {query: '*', params: {limit: 10, type: 'post'}, url: url('*')}

  it('finds nothing for the same request, whatever the order of the params', () => {
    expect(getRequestChanges(request, {...request, params: {type: 'post', limit: 10}})).toEqual([])
  })

  it('ignores a source map being turned on or off', () => {
    expect(
      getRequestChanges(request, {...request, url: url('*', {}, {resultSourceMap: 'true'})}),
    ).toEqual([])
  })

  it('lists the query, params and URL changes in order', () => {
    const next = {
      query: '*[_type == $type]',
      params: {type: 'author'},
      url: url(
        '*[_type == $type]',
        {type: 'author'},
        {perspective: 'drafts'},
        'https://abc123.api.sanity.io/v2021-10-21/data/query/staging',
      ),
    }
    expect(getRequestChanges(request, next)).toEqual([
      {id: 'query', previous: '*\n', next: '*[_type == $type]\n', lang: 'text'},
      {
        id: 'params',
        previous: '{\n  "limit": 10,\n  "type": "post"\n}\n',
        next: '{\n  "type": "author"\n}\n',
        lang: 'json',
      },
      {
        id: 'url',
        previous: `${BASE}\n`,
        next: 'https://abc123.api.sanity.io/v2021-10-21/data/query/staging\nperspective=drafts\n',
        lang: 'text',
      },
    ])
  })

  it('keeps a query that already ends with a newline as it is', () => {
    const [change] = getRequestChanges(request, {...request, query: '*[0]\n'})
    expect(change).toMatchObject({id: 'query', next: '*[0]\n'})
  })
})
