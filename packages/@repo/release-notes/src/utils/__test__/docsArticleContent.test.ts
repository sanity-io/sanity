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

  it('coerces the blockquote style to normal', () => {
    const block = textBlock({style: 'blockquote'})

    expect(toDocsArticleContent(block)).toEqual([expect.objectContaining({style: 'normal'})])
  })

  it('unwraps callout blocks into their inner content (callout is not in the schema)', () => {
    const callout = {
      _type: 'callout' as const,
      _key: 'callout-key',
      tone: 'note',
      content: [
        textBlock({
          _key: 'inner',
          style: 'blockquote',
          children: [{_type: 'span', _key: 's', text: 'Heads up', marks: []}],
        }),
      ],
    }

    expect(toDocsArticleContent(callout)).toEqual([
      expect.objectContaining({
        _type: 'block',
        _key: 'inner',
        style: 'normal',
        children: [{_type: 'span', _key: 's', text: 'Heads up', marks: []}],
      }),
    ])
  })

  it('drops empty callouts (e.g. horizontal-rule-only content)', () => {
    const callout = {
      _type: 'callout' as const,
      _key: 'callout-key',
      content: [{_type: 'horizontal-rule' as const, _key: 'hr'}],
    }

    expect(toDocsArticleContent(callout)).toEqual([])
  })

  it('lifts inline images out of a text block into block-level images', () => {
    const block = textBlock({
      children: [
        {_type: 'span', _key: 's1', text: 'before ', marks: []},
        {_type: 'image', _key: 'img', src: 'https://example.com/x.png', alt: 'x'},
        {_type: 'span', _key: 's2', text: ' after', marks: []},
      ],
    })

    expect(toDocsArticleContent(block)).toEqual([
      expect.objectContaining({
        _type: 'block',
        children: [
          {_type: 'span', _key: 's1', text: 'before ', marks: []},
          {_type: 'span', _key: 's2', text: ' after', marks: []},
        ],
      }),
      {_type: 'image', _key: 'img', src: 'https://example.com/x.png', alt: 'x'},
    ])
  })

  it('drops the text block when it only contained an inline image', () => {
    const block = textBlock({
      children: [{_type: 'image', _key: 'img', src: 'https://example.com/x.png', alt: 'x'}],
    })

    expect(toDocsArticleContent(block)).toEqual([
      {_type: 'image', _key: 'img', src: 'https://example.com/x.png', alt: 'x'},
    ])
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

  it('produces schema-valid blocks from real PR markdown (separator, link, alert, inline image)', () => {
    const markdown = `Fixed a bug, see [the docs](https://example.com/docs).

> [!NOTE]
> **Low Risk**
> Single predicate change.

Here is a shot ![screenshot](https://example.com/shot.png) inline.

---
`
    const blocks = markdownToPortableText(markdown).flatMap((block) => toDocsArticleContent(block))

    // no disallowed top-level block types survive
    expect(blocks.some((block) => block._type === 'horizontal-rule')).toBe(false)
    expect(blocks.some((block) => block._type === 'callout')).toBe(false)

    for (const block of blocks) {
      if (block._type === 'block') {
        // the blockquote style (from the unwrapped alert) is normalized away
        expect(block.style).not.toBe('blockquote')
        // no inline images remain in children
        expect(block.children.some((child) => child._type === 'image')).toBe(false)
        // every link mark def uses `url`, never `href`
        for (const markDef of block.markDefs) {
          if (markDef._type === 'link') {
            expect(markDef).toHaveProperty('url')
            expect(markDef).not.toHaveProperty('href')
          }
        }
      }
    }

    // the inline image was lifted to a block-level image
    expect(blocks.some((block) => block._type === 'image')).toBe(true)
  })
})
