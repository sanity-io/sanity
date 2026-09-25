import {describe, expect, it} from 'vitest'

import {
  createByteOffsetConverter,
  formatGroq,
  GroqSyntaxError,
  lintGroq,
  toGroqFindings,
} from './groqWasm'

async function syntaxErrorOf(promise: Promise<unknown>): Promise<GroqSyntaxError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof GroqSyntaxError) return error
    throw error
  }
  throw new Error('Expected a GroqSyntaxError')
}

describe('formatGroq', () => {
  it('formats with groq-format, keeping comments and parameters', async () => {
    const formatted = await formatGroq(
      '// authors\n*[_type=="author"&&name match $q]{_id,name, // the name\n"posts":*[references(^._id)]{title}}',
    )
    expect(formatted).toBe(
      [
        '// authors',
        '*[_type == "author" && name match $q] {',
        '  _id,',
        '  name, // the name',
        '  "posts": *[references(^._id)] { title }',
        '}',
      ].join('\n'),
    )
  })

  it('wraps at the requested width', async () => {
    const query = '*[_type == "post"]{title, body, "author": author->{name, image{asset->{url}}}}'
    const wide = await formatGroq(query, 200)
    expect(wide.split('\n')).toHaveLength(1)
    const narrow = await formatGroq(query, 40)
    expect(narrow.split('\n').every((line) => line.length <= 40)).toBe(true)
  })

  it('leaves blank queries alone', async () => {
    expect(await formatGroq('')).toBe('')
    expect(await formatGroq('  \n')).toBe('  \n')
  })

  it('rejects with the parser message and the offending range', async () => {
    const error = await syntaxErrorOf(formatGroq('*[_type == "a"'))
    expect(error.message).toBe("expected ']' following expression")
    expect(error.from).toBe(1)
    expect(error.to).toBe(14)
  })

  it('reports ranges as string indices when the query holds multi-byte characters', async () => {
    const query = '*[title == "héllo" && ]'
    const error = await syntaxErrorOf(formatGroq(query))
    expect(query.slice(error.from, error.to)).toBe(']')
  })
})

describe('lintGroq', () => {
  it('reports groq-lint findings with their ranges', async () => {
    const query = '*[_type == "post" && author->name == "x"]{title}'
    const findings = await lintGroq(query)

    expect(findings.map((finding) => finding.ruleId)).toEqual(['join-in-filter'])
    expect(findings[0].severity).toBe('error')
    expect(findings[0].message).toContain('Avoid joins')
    expect(query.slice(findings[0].from, findings[0].to)).toBe('author->')
  })

  it('returns nothing for clean or blank queries', async () => {
    expect(await lintGroq('*[_type == "post"]{title}')).toEqual([])
    expect(await lintGroq('')).toEqual([])
  })

  it('converts byte offsets to string indices', async () => {
    const query = '*[title == "wörld" && author->name == "x"]{title}'
    const [finding] = await lintGroq(query)
    expect(query.slice(finding.from, finding.to)).toBe('author->')
  })

  it('rejects with a GroqSyntaxError for queries that do not parse', async () => {
    const error = await syntaxErrorOf(lintGroq('*[_type == "a"'))
    expect(error.message).toBe("expected ']' following expression")
    expect([error.from, error.to]).toEqual([1, 14])
  })

  it('covers the whole query with a finding that has no span, whatever its characters', () => {
    const query = '*[title == "wörld — ünïcödé"]'
    const spanless = {ruleId: 'very-large-query', message: ' Too big ', severity: 'error'} as const
    const spanned = {...spanless, ruleId: 'x', span: {start: {offset: 2}, end: {offset: 7}}}
    expect(toGroqFindings([spanless, spanned], query)).toEqual([
      {
        ruleId: 'very-large-query',
        message: 'Too big',
        severity: 'error',
        from: 0,
        to: query.length,
      },
      {ruleId: 'x', message: 'Too big', severity: 'error', from: 2, to: 7},
    ])
  })
})

describe('createByteOffsetConverter', () => {
  it('is the identity for ASCII text, clamped to its length', () => {
    const toIndex = createByteOffsetConverter('abc')
    expect(toIndex(2)).toBe(2)
    expect(toIndex(10)).toBe(3)
    expect(toIndex(-1)).toBe(0)
  })

  it('counts UTF-8 bytes for multi-byte and astral characters', () => {
    const text = 'é€😀x'
    const toIndex = createByteOffsetConverter(text)
    expect(toIndex(0)).toBe(0)
    expect(toIndex(2)).toBe(1)
    expect(toIndex(5)).toBe(2)
    expect(toIndex(9)).toBe(4)
    expect(text.slice(toIndex(9))).toBe('x')
    expect(toIndex(100)).toBe(text.length)
  })
})
