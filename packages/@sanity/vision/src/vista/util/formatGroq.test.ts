import {describe, expect, it} from 'vitest'

import {formatGroq, GroqFormatError} from './formatGroq'

describe('formatGroq', () => {
  it('expands projections with several attributes and keeps single attribute ones inline', () => {
    expect(
      formatGroq(
        '*[_type == "author"]{_id, name, "posts": *[_type == "post" && references(^._id)]{title}}',
      ),
    ).toBe(
      [
        '*[_type == "author"]{',
        '  _id,',
        '  name,',
        '  "posts": *[_type == "post" && references(^._id)]{title}',
        '}',
      ].join('\n'),
    )
  })

  it('collapses whitespace while keeping the spacing choices between tokens', () => {
    expect(formatGroq('  *[ _type   ==  "author" ]  { _id }  ')).toBe('*[_type == "author"] {_id}')
    expect(formatGroq('*[_type=="author"]{_id}')).toBe('*[_type=="author"]{_id}')
  })

  it('never touches string literals', () => {
    const query = "*[title == \"a, {b} [c] // not a comment\" && slug.current == 'x\\'y']{_id}"
    expect(formatGroq(query)).toBe(query)
  })

  it('expands nested projections and objects in function calls', () => {
    expect(
      formatGroq(
        '*[_type == "post"]{_id, author->{name, image{asset->{url}}}, "kind": select(_type == "a" => {"x": 1, "y": 2}, {"z": 3})}',
      ),
    ).toBe(
      [
        '*[_type == "post"]{',
        '  _id,',
        '  author->{',
        '    name,',
        '    image{asset->{url}}',
        '  },',
        '  "kind": select(',
        '    _type == "a" => {',
        '      "x": 1,',
        '      "y": 2',
        '    },',
        '    {"z": 3}',
        '  )',
        '}',
      ].join('\n'),
    )
  })

  it('keeps comments, attaching trailing ones to their line', () => {
    expect(
      formatGroq(
        [
          '// all authors',
          '*[_type == "author"]{ // the fields',
          '  _id, // the id',
          '  // the title',
          '  title',
          '}',
        ].join('\n'),
      ),
    ).toBe(
      [
        '// all authors',
        '*[_type == "author"]{ // the fields',
        '  _id, // the id',
        '  // the title',
        '  title',
        '}',
      ].join('\n'),
    )
  })

  it('expands long single attribute projections and leaves empty ones alone', () => {
    const long = `*[_type == "post"]{"summary": coalesce(description, pt::text(body[0...2]), "No description available")}`
    expect(formatGroq(long)).toBe(
      [
        '*[_type == "post"]{',
        '  "summary": coalesce(description, pt::text(body[0...2]), "No description available")',
        '}',
      ].join('\n'),
    )
    expect(formatGroq('*[]{}')).toBe('*[]{}')
    expect(formatGroq('')).toBe('')
  })

  it('is idempotent', () => {
    const queries = [
      '*[_type == "author"]{_id, name, "posts": *[references(^._id)]{title, "n": count(tags)}}',
      '*[_type == "post"] | order(_createdAt desc) [0...10] {_id, title, categories[]->{title}}',
      '{"a": *[_type == "a"][0], "b": *[_type == "b"]{_id, x}}',
    ]
    for (const query of queries) {
      const once = formatGroq(query)
      expect(formatGroq(once)).toBe(once)
    }
  })

  it('throws for unbalanced brackets and unterminated strings', () => {
    expect(() => formatGroq('*[_type == "a"{_id}')).toThrow(GroqFormatError)
    expect(() => formatGroq('*[_type == "a"]{_id')).toThrow(GroqFormatError)
    expect(() => formatGroq('*[_type == "a]')).toThrow(GroqFormatError)
  })
})
