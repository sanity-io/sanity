import {type EditorSnapshot} from '@portabletext/editor'
import {describe, expect, test} from 'vitest'

import {classifyEditorPath} from './classifyEditorPath'

// Build a `TraversalSnapshot`-shaped fixture. The schema is built by
// hand to avoid a `@portabletext/schema` dev-dep just for tests; only
// `block.name` and `span.name` are read by the classifier and by
// `getEnclosingBlock`. The `containers` and `blockIndexMap` perf
// caches can be empty maps — the traversal helpers fall back to
// linear `_key` lookups when the cache misses.
function snapshot(value: unknown[]): EditorSnapshot {
  return {
    context: {
      schema: {
        block: {name: 'block'},
        span: {name: 'span'},
        styles: [{name: 'normal', value: 'normal'}],
        lists: [],
        decorators: [{name: 'strong', value: 'strong'}],
        annotations: [{name: 'link', fields: [{name: 'href', type: 'string', title: 'Href'}]}],
        blockObjects: [
          {name: 'image', fields: [{name: 'caption', type: 'string', title: 'Caption'}]},
        ],
        // A custom inline-object with a `text` field — EDEX-1421 /
        // portabletext/editor#2871 + #2872 made this reachable. Before
        // those PRs the `text` tail uniquely identified a span.
        inlineObjects: [
          {name: 'inlineNote', fields: [{name: 'text', type: 'string', title: 'Text'}]},
        ],
      },
      containers: new Map(),
      value: value as never,
    },
    blockIndexMap: new Map(),
    decoratorState: {} as never,
  } as unknown as EditorSnapshot
}

// Variant with registered containers, mirroring the `table > row > cell`
// shape in `dev/test-studio/schema/standard/portableText/customPlugins.tsx`
// from portabletext/editor + sanity-io/sanity#13315.
function nestedContainerSnapshot(value: unknown[]): EditorSnapshot {
  const cell = {kind: 'container', type: 'cell', field: {name: 'content', type: 'array', of: []}}
  const row = {
    kind: 'container',
    type: 'row',
    field: {name: 'cells', type: 'array', of: []},
    of: [cell],
  }
  const table = {
    kind: 'container',
    type: 'table',
    field: {name: 'rows', type: 'array', of: []},
    of: [row],
  }
  return {
    context: {
      schema: {
        block: {name: 'block'},
        span: {name: 'span'},
        styles: [{name: 'normal', value: 'normal'}],
        lists: [],
        decorators: [{name: 'strong', value: 'strong'}],
        annotations: [{name: 'link', fields: [{name: 'href', type: 'string', title: 'Href'}]}],
        blockObjects: [],
        inlineObjects: [],
      },
      containers: new Map([
        ['table', table],
        ['row', row],
        ['cell', cell],
      ]),
      value: value as never,
    },
    blockIndexMap: new Map(),
    decoratorState: {} as never,
  } as unknown as EditorSnapshot
}

describe(classifyEditorPath.name, () => {
  test('classifies a top-level block path as `block`', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        children: [{_key: 's1', _type: 'span', text: 'hi', marks: []}],
        markDefs: [],
      },
    ]
    expect(classifyEditorPath(snapshot(value), [{_key: 'b1'}])).toEqual({
      kind: 'block',
      blockPath: [{_key: 'b1'}],
    })
  })

  test('classifies a span text path as `spanText`', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        children: [{_key: 's1', _type: 'span', text: 'hi', marks: []}],
        markDefs: [],
      },
    ]
    expect(
      classifyEditorPath(snapshot(value), [{_key: 'b1'}, 'children', {_key: 's1'}, 'text']),
    ).toEqual({
      kind: 'spanText',
      blockPath: [{_key: 'b1'}],
      childPath: [{_key: 'b1'}, 'children', {_key: 's1'}],
    })
  })

  test('classifies an inline-object child as `inlineChild` (not `spanText`)', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        children: [{_key: 'i1', _type: 'inlineNote', text: 'see also'}],
        markDefs: [],
      },
    ]
    expect(classifyEditorPath(snapshot(value), [{_key: 'b1'}, 'children', {_key: 'i1'}])).toEqual({
      kind: 'inlineChild',
      blockPath: [{_key: 'b1'}],
      childPath: [{_key: 'b1'}, 'children', {_key: 'i1'}],
    })
  })

  test("classifies an inline object's `text` field as `objectField`, not `spanText`", () => {
    // An inline object's tail matches the span-text tail shape
    // [..., {_key}, 'text'] — without the `_type` check the
    // classifier would mis-resolve as `spanText` and yank DOM focus
    // into the editor instead of opening the object's dialog.
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        children: [{_key: 'i1', _type: 'inlineNote', text: 'see also'}],
        markDefs: [],
      },
    ]
    expect(
      classifyEditorPath(snapshot(value), [{_key: 'b1'}, 'children', {_key: 'i1'}, 'text']),
    ).toEqual({
      kind: 'objectField',
      blockPath: [{_key: 'b1'}],
      fieldPath: [{_key: 'b1'}, 'children', {_key: 'i1'}, 'text'],
    })
  })

  test('classifies an annotation path as `annotation`', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        children: [{_key: 's1', _type: 'span', text: 'hi', marks: ['m1']}],
        markDefs: [{_key: 'm1', _type: 'link', href: 'https://example.com'}],
      },
    ]
    expect(classifyEditorPath(snapshot(value), [{_key: 'b1'}, 'markDefs', {_key: 'm1'}])).toEqual({
      kind: 'annotation',
      blockPath: [{_key: 'b1'}],
      annotationPath: [{_key: 'b1'}, 'markDefs', {_key: 'm1'}],
    })
  })

  test('classifies a deeper annotation field path as `annotation` (not `objectField`)', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        children: [{_key: 's1', _type: 'span', text: 'hi', marks: ['m1']}],
        markDefs: [{_key: 'm1', _type: 'link', href: 'https://example.com'}],
      },
    ]
    expect(
      classifyEditorPath(snapshot(value), [{_key: 'b1'}, 'markDefs', {_key: 'm1'}, 'href']),
    ).toEqual({
      kind: 'annotation',
      blockPath: [{_key: 'b1'}],
      annotationPath: [{_key: 'b1'}, 'markDefs', {_key: 'm1'}],
    })
  })

  test('classifies an object-block field path as `objectField`', () => {
    const value = [{_key: 'img1', _type: 'image', caption: 'a photo'}]
    expect(classifyEditorPath(snapshot(value), [{_key: 'img1'}, 'caption'])).toEqual({
      kind: 'objectField',
      blockPath: [{_key: 'img1'}],
      fieldPath: [{_key: 'img1'}, 'caption'],
    })
  })

  test('classifies an empty path as `unknown`', () => {
    expect(classifyEditorPath(snapshot([]), [])).toEqual({kind: 'unknown'})
  })

  test('classifies an unresolvable path as `unknown`', () => {
    expect(classifyEditorPath(snapshot([]), [{_key: 'missing'}])).toEqual({kind: 'unknown'})
  })

  test('classifies a span text path inside a nested container', () => {
    // `table > row > cell > textBlock > span` — the schema shape
    // exercised by the `defineContainer` demos in
    // `dev/test-studio/schema/standard/portableText/customPlugins.tsx`.
    const value = [
      {
        _key: 't1',
        _type: 'table',
        rows: [
          {
            _key: 'r1',
            _type: 'row',
            cells: [
              {
                _key: 'c1',
                _type: 'cell',
                content: [
                  {
                    _key: 'b1',
                    _type: 'block',
                    children: [{_key: 's1', _type: 'span', text: 'hi', marks: []}],
                    markDefs: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]
    const path = [
      {_key: 't1'},
      'rows',
      {_key: 'r1'},
      'cells',
      {_key: 'c1'},
      'content',
      {_key: 'b1'},
      'children',
      {_key: 's1'},
      'text',
    ]
    expect(classifyEditorPath(nestedContainerSnapshot(value), path)).toEqual({
      kind: 'spanText',
      blockPath: [
        {_key: 't1'},
        'rows',
        {_key: 'r1'},
        'cells',
        {_key: 'c1'},
        'content',
        {_key: 'b1'},
      ],
      childPath: [
        {_key: 't1'},
        'rows',
        {_key: 'r1'},
        'cells',
        {_key: 'c1'},
        'content',
        {_key: 'b1'},
        'children',
        {_key: 's1'},
      ],
    })
  })

  test('classifies a text block inside a nested container as `block`', () => {
    const value = [
      {
        _key: 't1',
        _type: 'table',
        rows: [
          {
            _key: 'r1',
            _type: 'row',
            cells: [
              {
                _key: 'c1',
                _type: 'cell',
                content: [
                  {
                    _key: 'b1',
                    _type: 'block',
                    children: [{_key: 's1', _type: 'span', text: 'hi', marks: []}],
                    markDefs: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]
    const blockPath = [
      {_key: 't1'},
      'rows',
      {_key: 'r1'},
      'cells',
      {_key: 'c1'},
      'content',
      {_key: 'b1'},
    ]
    expect(classifyEditorPath(nestedContainerSnapshot(value), blockPath)).toEqual({
      kind: 'block',
      blockPath,
    })
  })

  test('classifies an annotation inside a nested container', () => {
    const value = [
      {
        _key: 't1',
        _type: 'table',
        rows: [
          {
            _key: 'r1',
            _type: 'row',
            cells: [
              {
                _key: 'c1',
                _type: 'cell',
                content: [
                  {
                    _key: 'b1',
                    _type: 'block',
                    children: [{_key: 's1', _type: 'span', text: 'hi', marks: ['m1']}],
                    markDefs: [{_key: 'm1', _type: 'link', href: 'https://example.com'}],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]
    const annotationPath = [
      {_key: 't1'},
      'rows',
      {_key: 'r1'},
      'cells',
      {_key: 'c1'},
      'content',
      {_key: 'b1'},
      'markDefs',
      {_key: 'm1'},
    ]
    expect(classifyEditorPath(nestedContainerSnapshot(value), annotationPath)).toEqual({
      kind: 'annotation',
      blockPath: [
        {_key: 't1'},
        'rows',
        {_key: 'r1'},
        'cells',
        {_key: 'c1'},
        'content',
        {_key: 'b1'},
      ],
      annotationPath,
    })
  })
})
