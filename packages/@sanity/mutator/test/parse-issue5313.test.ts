import {expect, test} from 'vitest'

import {parseJsonPath} from '../src/jsonpath/parse'

// Regression for https://github.com/sanity-io/sanity/issues/5313
//
// `@sanity/mutator`'s JSONPath parser only accepts a single `parseAttribute()` /
// `parseAlias()` on the LHS of a comparator inside a filter expression (see
// `parseFilterExpression` in `src/jsonpath/parse.ts`). A filter like
// `arr[asset._ref == "x"]` makes that branch rewind, `parseUnion` then falls
// through to `parsePath()` which consumes `asset._ref`, and the next token is
// `==` where `]` or `,` is expected, throwing `Expected ]`.
//
// The Content Lake's path parser accepts dotted-LHS filters, so a mutation
// using this selector commits server-side. Any Studio session that has the
// document open then crashes when the incoming patch is parsed by
// @sanity/mutator, and the document view stays broken until full reload.
//
// These tests pin the expected AST. They fail on `main` with `Expected ]` and
// will pass once `parseFilterExpression` learns to accept a dotted path on the
// LHS of the comparator.
test('parses a filter with a dotted-attribute LHS (e.g. asset._ref) — issue #5313', () => {
  expect(parseJsonPath('arr[asset._ref == "abc"]')).toEqual({
    type: 'path',
    nodes: [
      {type: 'attribute', name: 'arr'},
      {
        type: 'union',
        nodes: [
          {
            type: 'constraint',
            operator: '==',
            lhs: {
              type: 'path',
              nodes: [
                {type: 'attribute', name: 'asset'},
                {type: 'attribute', name: '_ref'},
              ],
            },
            rhs: {type: 'string', value: 'abc'},
          },
        ],
      },
    ],
  })
})

test('parses a deeper dotted-attribute LHS (e.g. meta.author.name) — issue #5313', () => {
  expect(parseJsonPath('items[meta.author.name == "jane"]')).toEqual({
    type: 'path',
    nodes: [
      {type: 'attribute', name: 'items'},
      {
        type: 'union',
        nodes: [
          {
            type: 'constraint',
            operator: '==',
            lhs: {
              type: 'path',
              nodes: [
                {type: 'attribute', name: 'meta'},
                {type: 'attribute', name: 'author'},
                {type: 'attribute', name: 'name'},
              ],
            },
            rhs: {type: 'string', value: 'jane'},
          },
        ],
      },
    ],
  })
})

test('parses a dotted-attribute LHS with a numeric comparator — issue #5313', () => {
  expect(parseJsonPath('variants[stock.warehouse >= 20]')).toEqual({
    type: 'path',
    nodes: [
      {type: 'attribute', name: 'variants'},
      {
        type: 'union',
        nodes: [
          {
            type: 'constraint',
            operator: '>=',
            lhs: {
              type: 'path',
              nodes: [
                {type: 'attribute', name: 'stock'},
                {type: 'attribute', name: 'warehouse'},
              ],
            },
            rhs: {type: 'number', value: 20},
          },
        ],
      },
    ],
  })
})

test('control: single-attribute LHS still parses (e.g. _key == "k1")', () => {
  // Sanity check — the documented workaround in the drafted reply (patch by
  // `_key` instead) must keep working. If this test starts failing the fix
  // has regressed the existing single-attribute LHS path.
  expect(parseJsonPath('arr[_key == "k1"]')).toEqual({
    type: 'path',
    nodes: [
      {type: 'attribute', name: 'arr'},
      {
        type: 'union',
        nodes: [
          {
            type: 'constraint',
            operator: '==',
            lhs: {type: 'attribute', name: '_key'},
            rhs: {type: 'string', value: 'k1'},
          },
        ],
      },
    ],
  })
})
