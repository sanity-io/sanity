import {diffInput, wrap} from '@sanity/diff'
import {type ObjectFieldType, type PatchOperations, type Path} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {
  type ArrayDiff,
  type ChangeNode,
  type FieldChangeNode,
  type FieldOperationsAPI,
  type GroupChangeNode,
  type ItemDiff,
  type ObjectDiff,
} from '../../types'
import {undoChange} from './undoChange'

const annotation = {timestamp: '2020-01-01T00:00:00.000Z', author: 'tester'}

const stringFieldType = {
  name: 'title',
  type: {name: 'string', jsonType: 'string'},
} as ObjectFieldType

function objectDiff(fromValue: unknown, toValue: unknown): ObjectDiff {
  return diffInput(wrap(fromValue, annotation), wrap(toValue, annotation)) as ObjectDiff
}

function fieldChange(
  path: Path,
  diff: FieldChangeNode['diff'],
  extras: Partial<FieldChangeNode> = {},
): FieldChangeNode {
  return {
    type: 'field',
    key: path.join('.') || 'root',
    path,
    titlePath: [],
    schemaType: stringFieldType,
    showHeader: true,
    showIndex: false,
    diff,
    ...extras,
  }
}

function groupChange(changes: ChangeNode[], path: Path = []): GroupChangeNode {
  return {
    type: 'group',
    key: 'group',
    path,
    titlePath: [],
    changes,
  }
}

function operations(): {
  api: FieldOperationsAPI
  executed: PatchOperations[][]
} {
  const executed: PatchOperations[][] = []
  return {
    executed,
    api: {
      patch: {
        execute: (patches) => {
          executed.push(patches)
        },
      },
    },
  }
}

describe('undoChange', () => {
  it('does nothing when the root diff is missing', () => {
    const {api, executed} = operations()
    undoChange(
      fieldChange(['title'], {
        type: 'string',
        action: 'changed',
        isChanged: true,
        fromValue: 'old',
        toValue: 'new',
        annotation,
        segments: [],
      }),
      null,
      api,
    )
    expect(executed).toEqual([])
  })

  it('unsets an added top-level field', () => {
    const root = objectDiff({keep: 'yes'}, {keep: 'yes', title: 'hello'})
    const {api, executed} = operations()
    undoChange(fieldChange(['title'], root.fields.title), root, api)
    expect(executed).toEqual([[{unset: ['title']}]])
  })

  it('restores a removed top-level field', () => {
    const root = objectDiff({title: 'hello'}, {})
    const {api, executed} = operations()
    undoChange(fieldChange(['title'], root.fields.title), root, api)
    expect(executed).toEqual([[{set: {title: 'hello'}}]])
  })

  it('sets a changed string back to its previous value', () => {
    const root = objectDiff({title: 'before'}, {title: 'after'})
    const {api, executed} = operations()
    undoChange(fieldChange(['title'], root.fields.title), root, api)
    expect(executed).toEqual([[{set: {title: 'before'}}]])
  })

  it('unsets an added nested field without collapsing typed stub ancestors', () => {
    const root = objectDiff(
      {keep: 'yes'},
      {
        keep: 'yes',
        meta: {_type: 'meta', seo: {_type: 'seo', title: 'hello'}},
      },
    )
    const metaDiff = root.fields.meta as ObjectDiff
    const seoDiff = metaDiff.fields.seo as ObjectDiff
    const {api, executed} = operations()
    undoChange(fieldChange(['meta', 'seo', 'title'], seoDiff.fields.title), root, api)
    expect(executed).toEqual([[{unset: ['meta.seo.title']}]])
  })

  // SAPP-4563: onlyContainsStubs is dead because of a De Morgan guard, so typed wrappers never collapse
  it.fails('unsets the furthest stub ancestor when reverting a nested add inside typed wrappers', () => {
    const root = objectDiff(
      {keep: 'yes'},
      {
        keep: 'yes',
        meta: {_type: 'meta', seo: {_type: 'seo', title: 'hello'}},
      },
    )
    const metaDiff = root.fields.meta as ObjectDiff
    const seoDiff = metaDiff.fields.seo as ObjectDiff
    const {api, executed} = operations()
    undoChange(fieldChange(['meta', 'seo', 'title'], seoDiff.fields.title), root, api)
    expect(executed).toEqual([[{unset: ['meta']}]])
  })

  it('collapses an empty-array ancestor when unsetting an added index', () => {
    const root = objectDiff({keep: 'yes', items: []}, {keep: 'yes', items: []})
    const {api, executed} = operations()
    undoChange(
      fieldChange(['items', 0], {
        type: 'string',
        action: 'added',
        isChanged: true,
        fromValue: undefined,
        toValue: 'x',
        annotation,
        segments: [],
      }),
      root,
      api,
    )
    expect(executed).toEqual([[{unset: ['items']}]])
  })

  it('restores a removed nested field and stubs missing parents', () => {
    const root = objectDiff({meta: {seo: {title: 'old'}}}, {})
    const metaDiff = root.fields.meta as ObjectDiff
    const seoDiff = metaDiff.fields.seo as ObjectDiff
    const {api, executed} = operations()
    undoChange(fieldChange(['meta', 'seo', 'title'], seoDiff.fields.title), root, api)
    expect(executed).toEqual([
      [
        {setIfMissing: {meta: {}}},
        {setIfMissing: {'meta.seo': {}}},
        {set: {'meta.seo.title': 'old'}},
      ],
    ])
  })

  it('moves an array item back to the start with prepend', () => {
    const fromValue = [
      {_key: 'a', title: 'A'},
      {_key: 'b', title: 'B'},
    ]
    const toValue = [
      {_key: 'b', title: 'B'},
      {_key: 'a', title: 'A'},
    ]
    const root = objectDiff({items: fromValue}, {items: toValue})
    const itemsDiff = root.fields.items as ArrayDiff
    const itemDiff: ItemDiff = {
      hasMoved: true,
      fromIndex: 0,
      toIndex: 1,
      annotation,
      diff: itemsDiff,
    }
    const {api, executed} = operations()
    undoChange(
      fieldChange(['items', {_key: 'a'}], itemsDiff, {
        itemDiff,
        parentDiff: itemsDiff,
      }),
      root,
      api,
    )
    expect(executed).toEqual([
      [
        {unset: ['items[_key=="a"]']},
        {insert: {before: 'items[0]', items: [{_key: 'a', title: 'A'}]}},
      ],
    ])
  })

  it('moves an array item back after the previous keyed sibling', () => {
    const fromValue = [
      {_key: 'a', title: 'A'},
      {_key: 'b', title: 'B'},
      {_key: 'c', title: 'C'},
    ]
    const toValue = [
      {_key: 'a', title: 'A'},
      {_key: 'c', title: 'C'},
      {_key: 'b', title: 'B'},
    ]
    const root = objectDiff({items: fromValue}, {items: toValue})
    const itemsDiff = root.fields.items as ArrayDiff
    const itemDiff: ItemDiff = {
      hasMoved: true,
      fromIndex: 1,
      toIndex: 2,
      annotation,
      diff: itemsDiff,
    }
    const {api, executed} = operations()
    undoChange(
      fieldChange(['items', {_key: 'b'}], itemsDiff, {
        itemDiff,
        parentDiff: itemsDiff,
      }),
      root,
      api,
    )
    expect(executed).toEqual([
      [
        {unset: ['items[_key=="b"]']},
        {insert: {after: 'items[_key=="a"]', items: [{_key: 'b', title: 'B'}]}},
      ],
    ])
  })

  it('moves an array item back after the previous index when siblings have no keys', () => {
    const fromValue = ['a', 'b', 'c']
    const toValue = ['a', 'c', 'b']
    const root = objectDiff({items: fromValue}, {items: toValue})
    const itemsDiff = root.fields.items as ArrayDiff
    const itemDiff: ItemDiff = {
      hasMoved: true,
      fromIndex: 1,
      toIndex: 2,
      annotation,
      diff: itemsDiff,
    }
    const {api, executed} = operations()
    undoChange(
      fieldChange(['items', 2], itemsDiff, {
        itemDiff,
        parentDiff: itemsDiff,
      }),
      root,
      api,
    )
    expect(executed).toEqual([[{unset: ['items[2]']}, {insert: {after: 'items[0]', items: ['b']}}]])
  })

  it('throws when a moved item cannot be found in the previous array', () => {
    const itemsDiff = {
      type: 'array',
      action: 'changed',
      isChanged: true,
      fromValue: undefined,
      toValue: ['a'],
      items: [],
      annotation,
    } as unknown as ArrayDiff
    const itemDiff: ItemDiff = {
      hasMoved: true,
      fromIndex: 0,
      toIndex: 1,
      annotation,
      diff: itemsDiff,
    }
    const root = objectDiff({items: ['a']}, {items: ['a']})
    const {api} = operations()
    expect(() =>
      undoChange(
        fieldChange(['items', 0], itemsDiff, {
          itemDiff,
          parentDiff: itemsDiff,
        }),
        root,
        api,
      ),
    ).toThrow('Failed to find item at index 0')
  })

  it('reverts a group by undoing non-adds first, then unsetting added fields', () => {
    const root = objectDiff({title: 'old'}, {title: 'new', extra: 'added'})
    const {api, executed} = operations()
    undoChange(
      groupChange([
        fieldChange(['title'], root.fields.title),
        fieldChange(['extra'], root.fields.extra),
      ]),
      root,
      api,
    )
    expect(executed).toEqual([[{set: {title: 'old'}}], [{unset: ['extra']}]])
  })

  it('unsets each added sibling path when they share a parent that still has values', () => {
    const root = objectDiff({keep: 'yes'}, {keep: 'yes', wrap: {a: '1', b: '2'}})
    const wrapDiff = root.fields.wrap as ObjectDiff
    const {api, executed} = operations()
    undoChange(
      groupChange([
        fieldChange(['wrap', 'a'], wrapDiff.fields.a),
        fieldChange(['wrap', 'b'], wrapDiff.fields.b),
      ]),
      root,
      api,
    )
    expect(executed).toEqual([[{unset: ['wrap.b', 'wrap.a']}]])
  })

  it('unsets added group children in reverse order when they do not share an ancestor', () => {
    const root = objectDiff({keep: 'yes'}, {keep: 'yes', first: '1', second: '2'})
    const {api, executed} = operations()
    undoChange(
      groupChange([
        fieldChange(['first'], root.fields.first),
        fieldChange(['second'], root.fields.second),
      ]),
      root,
      api,
    )
    expect(executed).toEqual([[{unset: ['second', 'first']}]])
  })

  it('does not stub the same parent twice when reverting two removed nested fields as a group', () => {
    const root = objectDiff({meta: {one: 'a', two: 'b'}}, {})
    const metaDiff = root.fields.meta as ObjectDiff
    const {api, executed} = operations()
    undoChange(
      groupChange([
        fieldChange(['meta', 'one'], metaDiff.fields.one),
        fieldChange(['meta', 'two'], metaDiff.fields.two),
      ]),
      root,
      api,
    )
    expect(executed).toEqual([
      [{setIfMissing: {meta: {}}}, {set: {'meta.one': 'a'}}],
      [{set: {'meta.two': 'b'}}],
      [{unset: []}],
    ])
  })

  it('inserts a missing keyed array item before restoring a removed nested field', () => {
    const fromValue = {items: [{_key: 'a', title: 'old'}]}
    const toValue = {items: []}
    const root = objectDiff(fromValue, toValue)
    const itemsDiff = root.fields.items as ArrayDiff
    const removed = itemsDiff.items.find((item) => item.fromIndex === 0)
    expect(removed).toBeDefined()
    const itemObjectDiff = removed!.diff as ObjectDiff
    const {api, executed} = operations()
    undoChange(fieldChange(['items', {_key: 'a'}, 'title'], itemObjectDiff.fields.title), root, api)
    expect(executed).toEqual([
      [
        {setIfMissing: {items: []}},
        {insert: {after: 'items[0]', items: [{_key: 'a'}]}},
        {set: {'items[_key=="a"].title': 'old'}},
      ],
    ])
  })
})
