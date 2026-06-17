import {type Path} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {editorOwnsCommentField, getCommentFieldPath, resolveCommentArray} from './dataPath'

const CALLOUT = {_key: 'callout'}
const BLOCK = {_key: 'b1'}
const SPAN = {_key: 's1'}

describe('comments dataPath: getCommentFieldPath', () => {
  test('root block: field is the editor path (unchanged from today)', () => {
    const basePath: Path = ['body']
    const selectionPath: Path = [BLOCK, 'children', SPAN]
    expect(getCommentFieldPath(basePath, selectionPath)).toBe('body')
  })

  test('inline container (body editor): field descends to the nested array', () => {
    const basePath: Path = ['body']
    const selectionPath: Path = [CALLOUT, 'content', BLOCK, 'children', SPAN]
    expect(getCommentFieldPath(basePath, selectionPath)).toBe('body[_key=="callout"].content')
  })

  test('dialog/void-object (nested input): same field as inline, from a deeper basePath', () => {
    const basePath: Path = ['body', CALLOUT, 'content']
    const selectionPath: Path = [BLOCK, 'children', SPAN]
    expect(getCommentFieldPath(basePath, selectionPath)).toBe('body[_key=="callout"].content')
  })

  test('the litmus: inline and dialog renderings produce an identical field', () => {
    const inline = getCommentFieldPath(['body'], [CALLOUT, 'content', BLOCK, 'children', SPAN])
    const dialog = getCommentFieldPath(['body', CALLOUT, 'content'], [BLOCK, 'children', SPAN])
    expect(inline).toBe(dialog)
  })
})

describe('comments dataPath: resolveCommentArray', () => {
  const nestedValue = [
    {
      _key: 'callout',
      _type: 'callout',
      content: [{_key: 'b1', _type: 'block', children: [{_key: 's1', text: 'hello'}]}],
    },
  ]

  test('field == basePath: empty descent, value as-is, no prefix (today)', () => {
    const result = resolveCommentArray(nestedValue, ['body'], 'body')
    expect(result).toEqual({array: nestedValue, prefix: []})
  })

  test('nested field: descends to the inner array and returns the keyed prefix', () => {
    const result = resolveCommentArray(nestedValue, ['body'], 'body[_key=="callout"].content')
    expect(result).toEqual({
      array: nestedValue[0].content,
      prefix: [{_key: 'callout'}, 'content'],
    })
  })

  test('field not under basePath: undefined', () => {
    expect(resolveCommentArray(nestedValue, ['body'], 'other')).toBeUndefined()
  })

  test('descent that does not resolve in the value: undefined', () => {
    expect(
      resolveCommentArray(nestedValue, ['body'], 'body[_key=="missing"].content'),
    ).toBeUndefined()
  })
})

describe('comments dataPath: editorOwnsCommentField', () => {
  test('owns its own path', () => {
    expect(editorOwnsCommentField(['body'], 'body')).toBe(true)
  })

  test('does not own a nested path when nothing is rendered inline (today)', () => {
    expect(editorOwnsCommentField(['body'], 'body[_key=="callout"].content')).toBe(false)
  })

  test('owns a nested path it renders inline', () => {
    expect(
      editorOwnsCommentField(['body'], 'body[_key=="callout"].content', [
        'body[_key=="callout"].content',
      ]),
    ).toBe(true)
  })

  test('the dialog content editor owns its own path regardless of inline paths', () => {
    expect(
      editorOwnsCommentField(
        ['body', {_key: 'callout'}, 'content'],
        'body[_key=="callout"].content',
      ),
    ).toBe(true)
  })
})
