import {describe, expect, it} from 'vitest'

import {toDocsArticleContent} from '../docsArticleContent'
import {
  markdownToPortableText,
  type NormalizedMarkdownBlock,
} from '../portabletext-markdown/markdownToPortableText'

function textBlock(overrides: Partial<NormalizedMarkdownBlock> = {}): NormalizedMarkdownBlock {
  return {
    _type: 'block',
    _key: 'block-key',
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: 'span-key', text: 'hello', marks: []}],
    ...overrides,
  } as NormalizedMarkdownBlock
}

describe('toDocsArticleContent', () => {
  it('drops horizontal-rule blocks (hyphenated type names are not valid in the docs schema)', () => {
    expect(toDocsArticleContent({_type: 'horizontal-rule', _key: 'hr'})).toEqual([])
  })

  it('renames link mark definitions from `href` to `url`', () => {
    const block = textBlock({
      markDefs: [{_key: 'link-1', _type: 'link', href: 'https://example.com'}],
    })

    expect(toDocsArticleContent(block)).toEqual([
      expect.objectContaining({
        _type: 'block',
        markDefs: [{_key: 'link-1', _type: 'link', url: 'https://example.com'}],
      }),
    ])
  })

  it('keeps other link fields and drops only `href`', () => {
    const block = textBlock({
      markDefs: [{_key: 'link-1', _type: 'link', href: 'https://example.com', title: 'Example'}],
    })

    const [result] = toDocsArticleContent(block)
    expect(result).toMatchObject({
      markDefs: [{_key: 'link-1', _type: 'link', title: 'Example', url: 'https://example.com'}],
    })
    expect((result as {markDefs: object[]}).markDefs[0]).not.toHaveProperty('href')
  })

  it('leaves mark definitions that already use `url` untouched', () => {
    const markDef = {_key: 'link-1', _type: 'link', url: 'https://example.com'}
    const block = textBlock({markDefs: [markDef]})

    expect(toDocsArticleContent(block)[0]).toMatchObject({markDefs: [markDef]})
  })

  it('ignores non-link mark definitions', () => {
    const markDef = {_key: 'anno-1', _type: 'annotation', href: 'https://example.com'}
    const block = textBlock({markDefs: [markDef]})

    expect(toDocsArticleContent(block)[0]).toMatchObject({markDefs: [markDef]})
  })

  it('wraps code blocks in a codeBlock', () => {
    const code = {_type: 'code' as const, _key: 'code-key', language: 'ts', code: 'const a = 1'}

    expect(toDocsArticleContent(code)).toEqual([
      {_type: 'codeBlock', _key: 'code-key', blocks: [{_key: 'code-key', code}]},
    ])
  })

  it('applies list overrides to text blocks only', () => {
    const block = textBlock()

    expect(toDocsArticleContent(block, {style: 'normal', listItem: 'bullet', level: 1})).toEqual([
      expect.objectContaining({listItem: 'bullet', level: 1, style: 'normal'}),
    ])
  })

  it('does not apply list overrides to non-text blocks (e.g. images)', () => {
    const image = {_type: 'image' as const, _key: 'img-key', src: 'https://example.com/x.png'}

    const [result] = toDocsArticleContent(image, {style: 'normal', listItem: 'bullet', level: 1})
    expect(result).toEqual(image)
    expect(result).not.toHaveProperty('listItem')
    expect(result).not.toHaveProperty('level')
  })

  it('produces schema-valid blocks from real PR markdown with a separator and a link', () => {
    const markdown = `Fixed a bug, see [the docs](https://example.com/docs).

---
`
    const blocks = markdownToPortableText(markdown).flatMap((block) => toDocsArticleContent(block))

    // no horizontal-rule blocks survive
    expect(blocks.some((block) => block._type === 'horizontal-rule')).toBe(false)

    // every link mark def uses `url`, never `href`
    for (const block of blocks) {
      if (block._type === 'block') {
        for (const markDef of block.markDefs) {
          if (markDef._type === 'link') {
            expect(markDef).toHaveProperty('url')
            expect(markDef).not.toHaveProperty('href')
          }
        }
      }
    }
  })
})
