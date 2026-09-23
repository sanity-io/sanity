import {type EditorSelection} from '@portabletext/editor'
import {describe, expect, test} from 'vitest'

import {COMMENT_INDICATORS} from '../utils/inline-comments/buildRangeDecorationSelectionsFromComments'
import {buildTextSelectionFromFragment} from '../utils/inline-comments/buildTextSelectionFromFragment'

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
    expect(result.value[0].text).toBe(`${COMMENT_INDICATORS[0]}Hello${COMMENT_INDICATORS[1]} world`)
  })

  test('multi-block selection: middle blocks resolve and wrap their full text', () => {
    const multiBlockDocument = {
      _id: 'doc1',
      _type: 'article',
      body: [
        {
          _key: 'first',
          _type: 'block',
          style: 'normal',
          markDefs: [],
          children: [{_type: 'span', _key: 's1', marks: [], text: 'First block'}],
        },
        {
          _key: 'middle',
          _type: 'block',
          style: 'normal',
          markDefs: [],
          children: [{_type: 'span', _key: 's1', marks: [], text: 'Middle block'}],
        },
        {
          _key: 'last',
          _type: 'block',
          style: 'normal',
          markDefs: [],
          children: [{_type: 'span', _key: 's1', marks: [], text: 'Last block'}],
        },
      ],
    }

    // Selection from "block" in `first` through "Last" in `last`, so the
    // fragment covers all three blocks and `middle` is neither the anchor
    // nor the focus block.
    const result = buildTextSelectionFromFragment({
      fragment: [
        {
          ...multiBlockDocument.body[0],
          children: [{...multiBlockDocument.body[0].children[0], text: 'block'}],
        },
        multiBlockDocument.body[1],
        {
          ...multiBlockDocument.body[2],
          children: [{...multiBlockDocument.body[2].children[0], text: 'Last'}],
        },
      ],
      documentValue: multiBlockDocument,
      basePath: ['body'],
      selection: {
        anchor: {path: [{_key: 'first'}, 'children', {_key: 's1'}], offset: 6},
        focus: {path: [{_key: 'last'}, 'children', {_key: 's1'}], offset: 4},
      },
    })

    expect(result.value).toEqual([
      {
        _key: 'first',
        text: `First ${COMMENT_INDICATORS[0]}block${COMMENT_INDICATORS[1]}`,
      },
      {
        _key: 'middle',
        text: `${COMMENT_INDICATORS[0]}Middle block${COMMENT_INDICATORS[1]}`,
      },
      {
        _key: 'last',
        text: `${COMMENT_INDICATORS[0]}Last${COMMENT_INDICATORS[1]} block`,
      },
    ])
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
