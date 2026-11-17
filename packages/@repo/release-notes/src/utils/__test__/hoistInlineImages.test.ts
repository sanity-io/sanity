import {describe, expect, it} from 'vitest'

import {hoistInlineImages} from '../hoistInlineImages'
import {type PortableTextBlock} from '../portabletext-markdown/types'

function span(key: string, text: string, marks: string[] = []) {
  return {_type: 'span' as const, _key: key, text, marks: marks as never[]}
}

function image(key: string) {
  return {_type: 'image' as const, _key: key, src: `https://example.com/${key}.png`}
}

function block(overrides: Partial<PortableTextBlock>): PortableTextBlock {
  return {_type: 'block', _key: 'b', style: 'normal', markDefs: [], children: [], ...overrides}
}

describe('hoistInlineImages', () => {
  it('returns a block with only spans untouched', () => {
    const input = block({children: [span('s', 'hello')]})
    expect(hoistInlineImages(input)).toEqual([input])
  })

  it('splits the text around an inline image into separate blocks', () => {
    const result = hoistInlineImages(
      block({
        _key: 'b',
        listItem: 'bullet',
        level: 1,
        children: [span('s1', 'before '), image('img'), span('s2', ' after')],
      }),
    )

    expect(result).toEqual([
      expect.objectContaining({
        _type: 'block',
        _key: 'b',
        listItem: 'bullet',
        children: [span('s1', 'before ')],
      }),
      image('img'),
      expect.objectContaining({
        _type: 'block',
        _key: 'b-2',
        listItem: 'bullet',
        children: [span('s2', ' after')],
      }),
    ])
  })

  it('drops text segments that are only whitespace, like the space between two badges', () => {
    const result = hoistInlineImages(
      block({children: [image('badge-1'), span('s', ' '), image('badge-2')]}),
    )

    expect(result).toEqual([image('badge-1'), image('badge-2')])
  })

  it('keeps only the mark definitions each remaining segment references', () => {
    const result = hoistInlineImages(
      block({
        markDefs: [
          {_key: 'link-1', _type: 'link', href: 'https://example.com/1'},
          {_key: 'link-2', _type: 'link', href: 'https://example.com/2'},
          {_key: 'orphan', _type: 'link', href: 'https://example.com/badge'},
        ],
        children: [span('s1', 'one', ['link-1']), image('img'), span('s2', 'two', ['link-2'])],
      }),
    )

    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({
      markDefs: [{_key: 'link-1', _type: 'link', href: 'https://example.com/1'}],
    })
    expect(result[2]).toMatchObject({
      markDefs: [{_key: 'link-2', _type: 'link', href: 'https://example.com/2'}],
    })
  })

  it('drops inline objects that are not images', () => {
    const result = hoistInlineImages(
      block({
        children: [
          span('s1', 'before'),
          {_type: 'code', _key: 'c', code: 'x'},
          span('s2', 'after'),
        ],
      }),
    )

    expect(result).toEqual([
      expect.objectContaining({_key: 'b', children: [span('s1', 'before')]}),
      expect.objectContaining({_key: 'b-1', children: [span('s2', 'after')]}),
    ])
  })
})
