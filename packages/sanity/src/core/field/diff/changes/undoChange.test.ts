import {diffInput, wrap} from '@sanity/diff'
import {Mutation} from '@sanity/mutator'
import {type ObjectFieldType, type PatchOperations, type Path} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {pathToString} from '../../paths/helpers'
import {
  type ArrayDiff,
  type ChangeNode,
  type Diff,
  type FieldChangeNode,
  type FieldOperationsAPI,
  type GroupChangeNode,
  type ItemDiff,
  type ObjectDiff,
} from '../../types'
import {undoChange} from './undoChange'

type DocumentValue = Record<string, unknown>

const fieldType = {name: 'field', type: {name: 'string', jsonType: 'string'}} as ObjectFieldType

function diffDocument(previous: DocumentValue, current: DocumentValue): ObjectDiff {
  return diffInput(wrap(previous, null), wrap(current, null)) as ObjectDiff
}

function fieldChange(
  path: Path,
  diff: Diff,
  extras: Partial<FieldChangeNode> = {},
): FieldChangeNode {
  return {
    type: 'field',
    key: pathToString(path),
    path,
    titlePath: [],
    schemaType: fieldType,
    showHeader: true,
    showIndex: true,
    diff,
    ...extras,
  }
}

function groupChange(changes: ChangeNode[]): GroupChangeNode {
  return {type: 'group', key: 'group', path: [], titlePath: [], changes}
}

function operations(): FieldOperationsAPI & {executed: PatchOperations[][]} {
  const executed: PatchOperations[][] = []
  return {
    executed,
    patch: {
      execute: (patches) => {
        executed.push(patches)
      },
    },
  }
}

/**
 * Reverts `change` on a document that went from `previous` to `current`, asserts that the
 * executed patches take the document back to `previous` when applied the way the document store
 * applies them, and returns the patches as executed (one array per `patch.execute` call).
 *
 * `applyTo` replays the patches onto a different document than `current`, for the case where the
 * document moved on after the diff was computed.
 */
function revert(
  previous: DocumentValue,
  current: DocumentValue,
  change: (rootDiff: ObjectDiff) => ChangeNode,
  applyTo: DocumentValue = current,
): PatchOperations[][] {
  const rootDiff = diffDocument(previous, current)
  const executed: PatchOperations[][] = []
  const documentOperations: FieldOperationsAPI = {
    patch: {
      execute: (patches) => {
        executed.push(patches)
      },
    },
  }

  undoChange(change(rootDiff), rootDiff, documentOperations)

  const mutation = new Mutation({
    mutations: executed.flat().map((patch) => ({patch: {id: 'doc', ...patch}})),
  })
  expect(mutation.apply({_id: 'doc', _type: 'doc', ...applyTo})).toEqual({
    _id: 'doc',
    _type: 'doc',
    ...previous,
  })

  return executed
}

function execute(
  previous: DocumentValue,
  current: DocumentValue,
  change: (rootDiff: ObjectDiff) => ChangeNode,
): PatchOperations[][] {
  const rootDiff = diffDocument(previous, current)
  const documentOperations = operations()
  undoChange(change(rootDiff), rootDiff, documentOperations)
  return documentOperations.executed
}

function movedItemChange(
  arrayDiff: ArrayDiff,
  path: Path,
  fromIndex: number,
  toIndex: number,
): FieldChangeNode {
  const itemDiff: ItemDiff = {
    hasMoved: true,
    fromIndex,
    toIndex,
    annotation: null,
    diff: arrayDiff,
  }
  return fieldChange(path, arrayDiff, {itemDiff, parentDiff: arrayDiff})
}

/** The change node Review changes builds for an unkeyed array item: the item diff at its position. */
function arrayItemChange(arrayDiff: ArrayDiff, fromIndex: number): FieldChangeNode {
  const item = arrayDiff.items.find((candidate) => candidate.fromIndex === fromIndex)!
  return fieldChange(['counts', arrayDiff.items.indexOf(item)], item.diff)
}

describe('undoChange', () => {
  it('does nothing when the root diff is missing', () => {
    const documentOperations = operations()
    undoChange(
      fieldChange(['title'], {
        type: 'string',
        action: 'changed',
        isChanged: true,
        fromValue: 'old',
        toValue: 'new',
        annotation: null,
        segments: [],
      }),
      null,
      documentOperations,
    )
    expect(documentOperations.executed).toEqual([])
  })

  it('sets a changed string back to its previous value instead of patching it', () => {
    const executed = revert({title: 'before'}, {title: 'after'}, (root) =>
      fieldChange(['title'], root.fields.title),
    )

    expect(executed).toEqual([[{set: {title: 'before'}}]])
  })

  it('unsets an added top-level field', () => {
    const executed = revert({keep: 'yes'}, {keep: 'yes', title: 'hello'}, (root) =>
      fieldChange(['title'], root.fields.title),
    )

    expect(executed).toEqual([[{unset: ['title']}]])
  })

  it('restores a removed top-level field', () => {
    const executed = revert({title: 'hello'}, {}, (root) =>
      fieldChange(['title'], root.fields.title),
    )

    expect(executed).toEqual([[{set: {title: 'hello'}}]])
  })

  it('sets changed strings inside an object back to their previous values', () => {
    const executed = revert(
      {slug: {_type: 'slug', current: 'old-slug'}},
      {slug: {_type: 'slug', current: 'new-slug'}},
      (root) => fieldChange(['slug'], root.fields.slug),
    )

    expect(executed).toEqual([
      [{setIfMissing: {slug: {_type: 'slug'}}}, {set: {'slug.current': 'old-slug'}}],
    ])
  })

  it('restores text inside a keyed array item without stubbing the parents that already exist', () => {
    const previousBlock = {
      _key: 'block1',
      _type: 'block',
      style: 'normal',
      children: [{_key: 'span1', _type: 'span', text: 'hello', marks: []}],
    }
    const currentBlock = {
      ...previousBlock,
      children: [{_key: 'span1', _type: 'span', text: 'hello world', marks: []}],
    }

    const executed = revert({body: [previousBlock]}, {body: [currentBlock]}, (root) =>
      fieldChange(['body', {_key: 'block1'}], (root.fields.body as ArrayDiff).items[0].diff),
    )

    expect(executed).toEqual([
      [
        {setIfMissing: {body: []}},
        {setIfMissing: {'body[_key=="block1"]': {_key: 'block1', _type: 'block'}}},
        {set: {'body[_key=="block1"].children[_key=="span1"].text': 'hello'}},
      ],
    ])
  })

  it('restores a removed nested field and stubs its missing ancestors', () => {
    const executed = revert({meta: {seo: {title: 'old'}}}, {}, (root) => {
      const seoDiff = (root.fields.meta as ObjectDiff).fields.seo as ObjectDiff
      return fieldChange(['meta', 'seo', 'title'], seoDiff.fields.title)
    })

    expect(executed).toEqual([
      [
        {setIfMissing: {meta: {}}},
        {setIfMissing: {'meta.seo': {}}},
        {set: {'meta.seo.title': 'old'}},
      ],
    ])
  })

  it('inserts a stub for a missing keyed array item before restoring a field inside it', () => {
    const executed = revert({items: [{_key: 'item1', title: 'old'}]}, {items: []}, (root) => {
      const itemsDiff = root.fields.items as ArrayDiff
      const removedItem = itemsDiff.items.find((item) => item.fromIndex === 0)!.diff as ObjectDiff
      return fieldChange(['items', {_key: 'item1'}, 'title'], removedItem.fields.title)
    })

    expect(executed).toEqual([
      [
        {setIfMissing: {items: []}},
        {insert: {after: 'items[0]', items: [{_key: 'item1'}]}},
        {set: {'items[_key=="item1"].title': 'old'}},
      ],
    ])
  })

  it('stubs a shared ancestor once when a group reverts several removed fields', () => {
    const executed = revert({meta: {one: 'a', two: 'b'}}, {}, (root) => {
      const metaDiff = root.fields.meta as ObjectDiff
      return groupChange([
        fieldChange(['meta', 'one'], metaDiff.fields.one),
        fieldChange(['meta', 'two'], metaDiff.fields.two),
      ])
    })

    expect(executed).toEqual([
      [{setIfMissing: {meta: {}}}, {set: {'meta.one': 'a'}}],
      [{set: {'meta.two': 'b'}}],
      [{unset: []}],
    ])
  })

  it('restores a reordered keyed array wholesale instead of swapping keys', () => {
    const previousItems = [
      {_key: 'item1', title: 'A'},
      {_key: 'item2', title: 'B'},
    ]
    const executed = revert(
      {items: previousItems},
      {
        items: [
          {_key: 'item2', title: 'B'},
          {_key: 'item1', title: 'A'},
        ],
      },
      (root) => fieldChange(['items'], root.fields.items),
    )

    expect(executed).toEqual([[{setIfMissing: {items: []}}, {set: {items: previousItems}}]])
  })

  it('restores a reordered keyed array exactly when an item carries one of the temporary keys', () => {
    // Forwarding diff-patch's key swaps would rename this item too and leave duplicate keys.
    const previousItems = [
      {_key: 'item1', title: 'A'},
      {_key: 'item2', title: 'B'},
    ]
    const executed = revert(
      {items: previousItems},
      {
        items: [
          {_key: 'item2', title: 'B'},
          {_key: 'item1', title: 'A'},
          {_key: '__temp_reorder_item2__', title: 'C'},
        ],
      },
      (root) => fieldChange(['items'], root.fields.items),
    )

    expect(executed).toEqual([[{setIfMissing: {items: []}}, {set: {items: previousItems}}]])
  })

  it('restores a block wholesale when the keyed array inside it was reordered', () => {
    const previousBlock = {
      _key: 'block1',
      _type: 'block',
      children: [
        {_key: 'span1', _type: 'span', text: 'Hello ', marks: []},
        {_key: 'span2', _type: 'span', text: 'world', marks: ['strong']},
      ],
    }
    const currentBlock = {
      ...previousBlock,
      children: [previousBlock.children[1], previousBlock.children[0]],
    }

    const executed = revert({body: [previousBlock]}, {body: [currentBlock]}, (root) =>
      fieldChange(['body', {_key: 'block1'}], (root.fields.body as ArrayDiff).items[0].diff),
    )

    expect(executed).toEqual([
      [
        {setIfMissing: {body: []}},
        {setIfMissing: {'body[_key=="block1"]': {_key: 'block1', _type: 'block'}}},
        {set: {'body[_key=="block1"]': previousBlock}},
      ],
    ])
  })

  it('restores removed keyed array items next to the items they used to follow', () => {
    const executed = revert(
      {items: [{_key: 'first'}, {_key: 'kept'}, {_key: 'last'}]},
      {items: [{_key: 'kept'}, {_key: 'added'}]},
      (root) => fieldChange(['items'], root.fields.items),
    )

    expect(executed).toEqual([
      [
        {unset: ['items[_key=="added"]']},
        {insert: {before: 'items[0]', items: [{_key: 'first'}]}},
        {insert: {after: 'items[_key=="kept"]', items: [{_key: 'last'}]}},
      ],
    ])
  })

  it('restores trailing primitive array items without stubbing the array', () => {
    const executed = revert({tags: ['a', 'b', 'c']}, {tags: ['a']}, (root) =>
      fieldChange(['tags'], root.fields.tags),
    )

    expect(executed).toEqual([[{insert: {after: 'tags[-1]', items: ['b', 'c']}}]])
  })

  it('restores a primitive array item in place when the current item at its index is falsy', () => {
    // Primitive items are keyed by value, so the change shows up as the removed `1` at index 1.
    const executed = revert({counts: [0, 1]}, {counts: [0, 0]}, (root) =>
      arrayItemChange(root.fields.counts as ArrayDiff, 1),
    )

    expect(executed).toEqual([[{setIfMissing: {counts: []}}, {set: {'counts[1]': 1}}]])
  })

  it('re-creates the slot of a removed trailing primitive item before restoring it', () => {
    const executed = revert({counts: [0, 1]}, {counts: [0]}, (root) =>
      arrayItemChange(root.fields.counts as ArrayDiff, 1),
    )

    expect(executed).toEqual([
      [
        {setIfMissing: {counts: []}},
        {insert: {after: 'counts[0]', items: [undefined]}},
        {set: {'counts[1]': 1}},
      ],
    ])
  })

  it('removes added primitive array items as a range', () => {
    const executed = revert({tags: ['a']}, {tags: ['a', 'b', 'c']}, (root) =>
      fieldChange(['tags'], root.fields.tags),
    )

    expect(executed).toEqual([[{unset: ['tags[1:]']}]])
  })

  it('sets a string inside an item whose key contains a dot, even after the document moved on', () => {
    // The exact `set` restores the previous value regardless of what the field holds by the time
    // the revert is applied, which a text patch computed against the old text would not.
    const executed = revert(
      {items: [{_key: 'dotted.key', title: 'before'}]},
      {items: [{_key: 'dotted.key', title: 'after'}]},
      (root) => fieldChange(['items'], root.fields.items),
      {items: [{_key: 'dotted.key', title: 'after, and edited again'}]},
    )

    expect(executed).toEqual([
      [{setIfMissing: {items: []}}, {set: {'items[_key=="dotted.key"].title': 'before'}}],
    ])
  })

  it('throws instead of setting undefined when a previous string cannot be resolved', () => {
    const rootDiff = diffDocument({title: 'before'}, {title: 'after'})
    const documentOperations = operations()

    // A change node whose path does not exist in the document the diff was computed for.
    expect(() =>
      undoChange(fieldChange(['renamed'], rootDiff.fields.title), rootDiff, documentOperations),
    ).toThrow('Cannot revert "renamed": the previous value could not be resolved')
    expect(documentOperations.executed).toEqual([])
  })

  it('unsets an added nested field without collapsing typed stub ancestors', () => {
    const executed = execute(
      {keep: 'yes'},
      {
        keep: 'yes',
        meta: {_type: 'meta', seo: {_type: 'seo', title: 'hello'}},
      },
      (root) => {
        const seoDiff = (root.fields.meta as ObjectDiff).fields.seo as ObjectDiff
        return fieldChange(['meta', 'seo', 'title'], seoDiff.fields.title)
      },
    )

    expect(executed).toEqual([[{unset: ['meta.seo.title']}]])
  })

  // SAPP-4563: onlyContainsStubs is dead because of a De Morgan guard, so typed wrappers never collapse
  it.fails('unsets the furthest stub ancestor when reverting a nested add inside typed wrappers', () => {
    const executed = execute(
      {keep: 'yes'},
      {
        keep: 'yes',
        meta: {_type: 'meta', seo: {_type: 'seo', title: 'hello'}},
      },
      (root) => {
        const seoDiff = (root.fields.meta as ObjectDiff).fields.seo as ObjectDiff
        return fieldChange(['meta', 'seo', 'title'], seoDiff.fields.title)
      },
    )

    expect(executed).toEqual([[{unset: ['meta']}]])
  })

  it('collapses an empty-array ancestor when unsetting an added index', () => {
    const executed = execute({keep: 'yes', items: []}, {keep: 'yes', items: []}, (root) =>
      fieldChange(['items', 0], {
        type: 'string',
        action: 'added',
        isChanged: true,
        fromValue: undefined,
        toValue: 'x',
        annotation: null,
        segments: [],
      }),
    )

    expect(executed).toEqual([[{unset: ['items']}]])
  })

  it('moves an array item back to the start with prepend', () => {
    const previousItems = [
      {_key: 'a', title: 'A'},
      {_key: 'b', title: 'B'},
    ]
    const executed = revert(
      {items: previousItems},
      {
        items: [
          {_key: 'b', title: 'B'},
          {_key: 'a', title: 'A'},
        ],
      },
      (root) => movedItemChange(root.fields.items as ArrayDiff, ['items', {_key: 'a'}], 0, 1),
    )

    expect(executed).toEqual([
      [
        {unset: ['items[_key=="a"]']},
        {insert: {before: 'items[0]', items: [{_key: 'a', title: 'A'}]}},
      ],
    ])
  })

  it('moves an array item back after the previous keyed sibling', () => {
    const previousItems = [
      {_key: 'a', title: 'A'},
      {_key: 'b', title: 'B'},
      {_key: 'c', title: 'C'},
    ]
    const executed = revert(
      {items: previousItems},
      {
        items: [
          {_key: 'a', title: 'A'},
          {_key: 'c', title: 'C'},
          {_key: 'b', title: 'B'},
        ],
      },
      (root) => movedItemChange(root.fields.items as ArrayDiff, ['items', {_key: 'b'}], 1, 2),
    )

    expect(executed).toEqual([
      [
        {unset: ['items[_key=="b"]']},
        {insert: {after: 'items[_key=="a"]', items: [{_key: 'b', title: 'B'}]}},
      ],
    ])
  })

  it('moves an array item back after the previous index when siblings have no keys', () => {
    const executed = revert({items: ['a', 'b', 'c']}, {items: ['a', 'c', 'b']}, (root) =>
      movedItemChange(root.fields.items as ArrayDiff, ['items', 2], 1, 2),
    )

    expect(executed).toEqual([[{unset: ['items[2]']}, {insert: {after: 'items[0]', items: ['b']}}]])
  })

  it('throws when a moved item cannot be found in the previous array', () => {
    const rootDiff = diffDocument({items: ['a']}, {items: ['a']})
    const itemsDiff = {
      ...(rootDiff.fields.items as ArrayDiff),
      fromValue: undefined,
    } as ArrayDiff
    const documentOperations = operations()

    expect(() =>
      undoChange(movedItemChange(itemsDiff, ['items', 0], 0, 1), rootDiff, documentOperations),
    ).toThrow('Failed to find item at index 0')
    expect(documentOperations.executed).toEqual([])
  })

  it('reverts a group by undoing non-adds first, then unsetting added fields', () => {
    const executed = revert({title: 'old'}, {title: 'new', extra: 'added'}, (root) =>
      groupChange([
        fieldChange(['title'], root.fields.title),
        fieldChange(['extra'], root.fields.extra),
      ]),
    )

    expect(executed).toEqual([[{set: {title: 'old'}}], [{unset: ['extra']}]])
  })

  it('unsets each added sibling path when they share a parent that still has values', () => {
    const executed = execute({keep: 'yes'}, {keep: 'yes', wrap: {a: '1', b: '2'}}, (root) => {
      const wrapDiff = root.fields.wrap as ObjectDiff
      return groupChange([
        fieldChange(['wrap', 'a'], wrapDiff.fields.a),
        fieldChange(['wrap', 'b'], wrapDiff.fields.b),
      ])
    })

    expect(executed).toEqual([[{unset: ['wrap.b', 'wrap.a']}]])
  })

  it('unsets added group children in reverse order when they do not share an ancestor', () => {
    const executed = revert({keep: 'yes'}, {keep: 'yes', first: '1', second: '2'}, (root) =>
      groupChange([
        fieldChange(['first'], root.fields.first),
        fieldChange(['second'], root.fields.second),
      ]),
    )

    expect(executed).toEqual([[{unset: ['second', 'first']}]])
  })
})
