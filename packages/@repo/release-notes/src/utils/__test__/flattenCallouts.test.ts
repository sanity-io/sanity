import {describe, expect, it} from 'vitest'

import {flattenCallouts} from '../flattenCallouts'
import {
  markdownToPortableText,
  type NormalizedMarkdownBlock,
} from '../portabletext-markdown/markdownToPortableText'

function textBlock(_key: string, text: string): NormalizedMarkdownBlock {
  return {
    _type: 'block',
    _key,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `${_key}-span`, text, marks: []}],
  } as NormalizedMarkdownBlock
}

describe('flattenCallouts', () => {
  it('leaves non-callout blocks untouched', () => {
    const blocks = [textBlock('a', 'hello')]
    expect(flattenCallouts(blocks)).toEqual(blocks)
  })

  it('unwraps callout content in place, preserving order', () => {
    const before = textBlock('before', 'before')
    const inner1 = textBlock('inner1', 'inner one')
    const inner2 = textBlock('inner2', 'inner two')
    const after = textBlock('after', 'after')

    const result = flattenCallouts([
      before,
      {
        _type: 'callout',
        _key: 'c',
        tone: 'note',
        content: [inner1, inner2],
      } as NormalizedMarkdownBlock,
      after,
    ])

    expect(result).toEqual([before, inner1, inner2, after])
  })

  it('drops callouts with empty content', () => {
    const result = flattenCallouts([
      {_type: 'callout', _key: 'c', tone: 'note', content: []} as NormalizedMarkdownBlock,
    ])
    expect(result).toEqual([])
  })

  it('produces no `callout` blocks from real PR markdown containing a GFM alert', () => {
    const markdown = `Before.

> [!WARNING]
> Heads up.

After.`
    const result = flattenCallouts(markdownToPortableText(markdown))
    expect(result.some((block) => block._type === 'callout')).toBe(false)
  })
})
