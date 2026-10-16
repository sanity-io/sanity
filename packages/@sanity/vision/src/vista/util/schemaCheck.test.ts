import {Schema} from '@sanity/schema'
import {describe, expect, it} from 'vitest'

import {parseGroq} from './groqFunctions'
import {checkQuerySchema, createQuerySchema, type SchemaFinding} from './schemaCheck'

const schema = createQuerySchema(
  Schema.compile({
    name: 'test',
    types: [
      // The studio's own slug type, which the bare schema compiler does not have
      {
        name: 'slug',
        type: 'object',
        fields: [
          {name: 'current', type: 'string'},
          {name: 'source', type: 'string'},
        ],
      },
      {
        name: 'author',
        type: 'document',
        fields: [
          {name: 'name', type: 'string'},
          {name: 'bestFriend', type: 'reference', to: [{type: 'author'}]},
          {name: 'books', type: 'array', of: [{type: 'reference', to: [{type: 'book'}]}]},
          {name: 'slug', type: 'slug'},
          {name: 'address', type: 'object', fields: [{name: 'city', type: 'string'}]},
        ],
      },
      {
        name: 'book',
        type: 'document',
        fields: [
          {name: 'title', type: 'string'},
          {name: 'author', type: 'reference', to: [{type: 'author'}]},
          {name: 'tags', type: 'array', of: [{type: 'string'}]},
          {
            name: 'body',
            type: 'array',
            of: [
              {type: 'block'},
              {type: 'object', name: 'callout', fields: [{name: 'text', type: 'string'}]},
            ],
          },
        ],
      },
    ],
  }),
)

function check(query: string): SchemaFinding[] {
  return checkQuerySchema(parseGroq(query), query, schema)
}

/** The flagged text, with what the finding suggests instead */
function flagged(query: string): [string, string | undefined][] {
  return check(query).map((finding) => [
    query.slice(finding.from, finding.to),
    finding.suggestion?.text,
  ])
}

describe('checkQuerySchema', () => {
  it('flags document types the schema does not have, suggesting the one probably meant', () => {
    const [finding] = check('*[_type == "athor"]')
    expect(finding).toMatchObject({
      rule: 'unknown-type',
      message: 'The schema has no document type named `athor`. Did you mean `author`?',
      suggestion: {text: '"author"'},
    })
    expect(flagged('*[_type in ["author", "bok"] || _type == "book"]')).toEqual([
      ['"bok"', '"book"'],
    ])
    expect(flagged('*["author" == _type]')).toEqual([])
  })

  it('flags fields no type in scope has, in filters, projections and order()', () => {
    expect(flagged('*[_type == "author" && nmae == "x"]{name, titel}')).toEqual([
      ['nmae', 'name'],
      ['titel', undefined],
    ])
    expect(check('*[_type == "author"]{titel}')[0].message).toBe(
      '`titel` is not a field of `author`.',
    )
    expect(flagged('*[_type == "author" && defined(nmae)] | order(nme asc)[0...10]{name}')).toEqual(
      [
        ['nmae', 'name'],
        ['nme', 'name'],
      ],
    )
    // In any of the types the filter allows
    expect(flagged('*[_type == "author" || _type == "book"]{title, name, nope}')).toEqual([
      ['nope', undefined],
    ])
    expect(check('*[_type in ["author", "book"]]{nope}')[0].message).toBe(
      '`nope` is not a field of `author` or `book`.',
    )
  })

  it('follows references, arrays and nested objects', () => {
    expect(
      flagged(
        '*[_type == "book"]{author->{name, nmae}, "n": author->nme, "b": author->bestFriend->name}',
      ),
    ).toEqual([
      ['nmae', 'name'],
      ['nme', 'name'],
    ])
    expect(flagged('*[_type == "author"]{books[]->{title, titel}}')).toEqual([['titel', 'title']])
    expect(
      flagged('*[_type == "author"]{address.city, address.zip, slug.current, slug.curent}'),
    ).toEqual([
      ['zip', undefined],
      ['curent', 'current'],
    ])
  })

  it('flags a field read from a reference without following it, and following what is not one', () => {
    const query = '*[_type == "book"]{"n": author.name, title->}'
    const findings = check(query)
    expect(findings.map((finding) => finding.rule)).toEqual(['not-a-reference', 'not-a-reference'])
    expect(findings[0].message).toBe(
      '`author` is a reference, which holds no `name`: follow it with `author->name`.',
    )
    // The fix turns the dot into an arrow
    expect(findings[0].suggestion).toEqual({
      text: '->',
      from: query.indexOf('.name'),
      to: query.indexOf('.name') + 1,
    })
    expect(findings[1].message).toBe('`title` is not a reference, so `->` gives null.')
    expect(flagged('*[_type == "book"]{"r": author._ref}')).toEqual([])
    expect(flagged('*[_type == "author"]{name.first}')).toEqual([['first', undefined]])
  })

  it('reads ^ as the scope a subquery is written in', () => {
    expect(
      flagged(
        '*[_type == "author"]{"books": *[_type == "book" && author._ref == ^._id]{title}, "x": *[_type == "book" && title == ^.nmae]}',
      ),
    ).toEqual([['nmae', 'name']])
  })

  it('narrows to the type a conditional projection asks for', () => {
    expect(
      flagged(
        '*[_type == "book"]{body[]{_type == "callout" => {text, txt}, _type == "calout" => {text}}}',
      ),
    ).toEqual([
      ['txt', 'text'],
      ['"calout"', '"callout"'],
    ])
  })

  it('leaves a field alone when the schema cannot resolve its type', () => {
    const broken = createQuerySchema(
      Schema.compile({
        name: 'broken',
        types: [
          {
            name: 'page',
            type: 'document',
            fields: [
              {name: 'title', type: 'string'},
              {name: 'seo', type: 'missingType'},
            ],
          },
        ],
      }),
    )
    const query = '*[_type == "page"]{title, seo.anything, nope}'
    expect(
      checkQuerySchema(parseGroq(query), query, broken).map((finding) =>
        query.slice(finding.from, finding.to),
      ),
    ).toEqual(['nope'])
  })

  it('leaves alone what the schema cannot tell', () => {
    // No type filter, a parameter, system fields, spreads, slices, function bodies, syntax errors
    expect(flagged('*[nmae == "x"]{whatever}')).toEqual([])
    expect(flagged('*[_type == $type]{whatever}')).toEqual([])
    expect(flagged('*[_type == "author"]{_id, _type, _createdAt, ..., "c": count(books)}')).toEqual(
      [],
    )
    expect(flagged('*[_type == "author"][0]{nmae}')).toEqual([['nmae', 'name']])
    expect(flagged('*[_type != "author"]{nmae}')).toEqual([])
    expect(flagged('fn my::x($a) = $a{nope}; *[_type == "author"]{"x": my::x(@)}')).toEqual([])
    expect(flagged('*[_type == "author"]{nmae')).toEqual([])
  })
})
