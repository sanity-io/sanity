import {type Path} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {getCommentFieldPath} from '../utils/inline-comments/dataPath'

const CALLOUT = {_key: 'callout'}
const BLOCK = {_key: 'b1'}
const SPAN = {_key: 's1'}

const textBlock = (key: string, text: string) => ({
  _type: 'block',
  _key: key,
  children: [{_type: 'span', _key: 's1', text, marks: []}],
  markDefs: [],
  style: 'normal',
})

describe('getCommentFieldPath', () => {
  test('root block: field is the editor path', () => {
    const documentValue = {body: [textBlock('b1', 'root')]}
    const basePath: Path = ['body']
    const selectionPath: Path = [BLOCK, 'children', SPAN, 'text']
    expect(getCommentFieldPath(documentValue, basePath, selectionPath)).toBe('body')
  })

  test('inline container (body editor): field descends to the nested array', () => {
    const documentValue = {
      body: [{_type: 'callout', _key: 'callout', content: [textBlock('b1', 'nested')]}],
    }
    const basePath: Path = ['body']
    const selectionPath: Path = [CALLOUT, 'content', BLOCK, 'children', SPAN, 'text']
    expect(getCommentFieldPath(documentValue, basePath, selectionPath)).toBe(
      'body[_key=="callout"].content',
    )
  })

  test('dialog/void-object (nested input): same field as inline, from a deeper basePath', () => {
    const documentValue = {
      body: [{_type: 'callout', _key: 'callout', content: [textBlock('b1', 'nested')]}],
    }
    const basePath: Path = ['body', CALLOUT, 'content']
    const selectionPath: Path = [BLOCK, 'children', SPAN, 'text']
    expect(getCommentFieldPath(documentValue, basePath, selectionPath)).toBe(
      'body[_key=="callout"].content',
    )
  })

  test('inline and dialog renderings produce an identical field', () => {
    const documentValue = {
      body: [{_type: 'callout', _key: 'callout', content: [textBlock('b1', 'nested')]}],
    }
    const inline = getCommentFieldPath(
      documentValue,
      ['body'],
      [CALLOUT, 'content', BLOCK, 'children', SPAN, 'text'],
    )
    const dialog = getCommentFieldPath(
      documentValue,
      ['body', CALLOUT, 'content'],
      [BLOCK, 'children', SPAN, 'text'],
    )
    expect(inline).toBe(dialog)
  })

  test('depth-2 nesting (table > row > cell > content) descends every level', () => {
    const documentValue = {
      body: [
        {
          _type: 'table',
          _key: 't1',
          rows: [
            {
              _type: 'row',
              _key: 'r1',
              cells: [{_type: 'cell', _key: 'c1', content: [textBlock('b1', 'nested')]}],
            },
          ],
        },
      ],
    }
    const selectionPath: Path = [
      {_key: 't1'},
      'rows',
      {_key: 'r1'},
      'cells',
      {_key: 'c1'},
      'content',
      BLOCK,
      'children',
      SPAN,
      'text',
    ]
    expect(getCommentFieldPath(documentValue, ['body'], selectionPath)).toBe(
      'body[_key=="t1"].rows[_key=="r1"].cells[_key=="c1"].content',
    )
  })

  test('returns undefined when the selection path has no enclosing text block in the document', () => {
    const documentValue = {body: []}
    const basePath: Path = ['body']
    const selectionPath: Path = [BLOCK, 'children', SPAN, 'text']
    expect(getCommentFieldPath(documentValue, basePath, selectionPath)).toBeUndefined()
  })

  test('returns undefined for a block-object selection (no text block to anchor on)', () => {
    const documentValue = {body: [{_type: 'image', _key: 'img1', asset: {}}]}
    const basePath: Path = ['body']
    const selectionPath: Path = [{_key: 'img1'}]
    expect(getCommentFieldPath(documentValue, basePath, selectionPath)).toBeUndefined()
  })
})
