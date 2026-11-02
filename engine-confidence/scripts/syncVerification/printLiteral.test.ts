import {describe, expect, test} from 'vitest'

import {printLiteral} from './printLiteral'

describe('printLiteral', () => {
  test('prints primitives with single quotes', () => {
    expect(printLiteral("it's")).toBe("'it\\'s'")
    expect(printLiteral([1, true, null])).toBe('[1, true, null]')
  })

  test('keeps an object without nested values on one line however long it is', () => {
    const document = {
      _type: 'article',
      _rev: 'seed',
      _createdAt: '2026-01-01T00:00:00.000Z',
      _updatedAt: '2026-01-01T00:00:00.000Z',
      _id: 'article-gen',
      title: 'published',
    }
    expect(printLiteral(document)).toBe(
      "{_type: 'article', _rev: 'seed', _createdAt: '2026-01-01T00:00:00.000Z', _updatedAt: '2026-01-01T00:00:00.000Z', _id: 'article-gen', title: 'published'}",
    )
  })

  test('keeps short nested values on one line and quotes keys that are not identifiers', () => {
    expect(
      printLiteral({client: 'A', do: 'patch', patches: [{set: {'items[_key=="a"].title': 'one'}}]}),
    ).toBe("{client: 'A', do: 'patch', patches: [{set: {'items[_key==\"a\"].title': 'one'}}]}")
  })

  test('expands what does not fit, one entry per line with trailing commas', () => {
    const value = {
      id: 'GEN',
      steps: [
        {client: 'A', do: 'patch', id: 'drafts.article-gen', patches: [{set: {title: 'one'}}]},
        {client: 'B', do: 'commit'},
        {
          client: 'A',
          do: 'patch',
          id: 'drafts.article-gen',
          patches: [{set: {title: 'twotwotwo'}}],
        },
      ],
    }
    expect(printLiteral(value)).toBe(
      [
        '{',
        "  id: 'GEN',",
        '  steps: [',
        "    {client: 'A', do: 'patch', id: 'drafts.article-gen', patches: [{set: {title: 'one'}}]},",
        "    {client: 'B', do: 'commit'},",
        "    {client: 'A', do: 'patch', id: 'drafts.article-gen', patches: [{set: {title: 'twotwotwo'}}]},",
        '  ],',
        '}',
      ].join('\n'),
    )
  })

  test('prints empty containers', () => {
    expect(printLiteral({steps: [], extra: {}})).toBe('{steps: [], extra: {}}')
  })
})
