import {type EditorSelection} from '@portabletext/editor'
import {describe, expect, test} from 'vitest'

import {COMMENT_INDICATORS} from '../utils/inline-comments/buildRangeDecorationSelectionsFromComments'
import {buildTextSelectionFromFragment} from '../utils/inline-comments/buildTextSelectionFromFragment'

// A body PT array with one top-level block, and a callout container whose
// content is a nested PT array. The two blocks share the same _key intentionally
// to prove the walker never confuses them across arrays.
const documentValue = {
  _id: 'doc1',
  _type: 'article',
  body: [
    {
      _key: 'b1',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 's1', marks: [], text: 'Hello world'}],
    },
    {
      _key: 'callout',
      _type: 'callout',
      content: [
        {
          _key: 'b1',
          _type: 'block',
          style: 'normal',
          markDefs: [],
          children: [{_type: 'span', _key: 's1', marks: [], text: 'Nested there world'}],
        },
      ],
    },
  ],
}

const bodyBlock = documentValue.body[0] as {
  _key: string
  _type: string
  style: string
  markDefs: unknown[]
  children: Array<{_type: string; _key: string; marks: string[]; text: string}>
}
const nestedBlock = (documentValue.body[1] as {content: Array<typeof bodyBlock>}).content[0]

function fragmentOf(block: typeof bodyBlock, sliceText: string) {
  return [
    {
      _key: block._key,
      _type: block._type,
      style: block.style,
      markDefs: block.markDefs,
      children: [{...block.children[0], text: sliceText}],
    },
  ]
}

const selectionOnBlock = (
  block: typeof bodyBlock,
  anchor: number,
  focus: number,
): EditorSelection => ({
  anchor: {path: [{_key: block._key}, 'children', {_key: block.children[0]._key}], offset: anchor},
  focus: {path: [{_key: block._key}, 'children', {_key: block.children[0]._key}], offset: focus},
})

describe('comments: buildTextSelectionFromFragment', () => {
  test('root editor: resolves the block through the document value and wraps commented text', () => {
    const result = buildTextSelectionFromFragment({
      fragment: fragmentOf(bodyBlock, 'Hello'),
      documentValue,
      basePath: ['body'],
      selection: selectionOnBlock(bodyBlock, 0, 5),
    })

    expect(result.value[0]._key).toBe('b1')
    // Non-empty text means the walker found the block; empty text is the bug.
    expect(result.value[0].text).toBe(`${COMMENT_INDICATORS[0]}Hello${COMMENT_INDICATORS[1]} world`)
  })

  test('nested-container editor: resolves the same-keyed block inside the container', () => {
    const result = buildTextSelectionFromFragment({
      fragment: fragmentOf(nestedBlock, 'Neste'),
      documentValue,
      basePath: ['body', {_key: 'callout'}, 'content'],
      selection: selectionOnBlock(nestedBlock, 0, 5),
    })

    expect(result.value[0]._key).toBe('b1')
    expect(result.value[0].text).toBe(
      `${COMMENT_INDICATORS[0]}Neste${COMMENT_INDICATORS[1]}d there world`,
    )
  })
})
