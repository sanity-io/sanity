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
  type ObjectDiff,
} from '../../types'
import {undoChange} from './undoChange'

type DocumentValue = Record<string, unknown>

const fieldType = {name: 'field', type: {name: 'string', jsonType: 'string'}} as ObjectFieldType

function diffDocument(previous: DocumentValue, current: DocumentValue): ObjectDiff {
  return diffInput(wrap(previous, null), wrap(current, null)) as ObjectDiff
}

function fieldChange(path: Path, diff: Diff): FieldChangeNode {
  return {
    type: 'field',
    key: pathToString(path),
    path,
    titlePath: [],
    schemaType: fieldType,
    showHeader: true,
    showIndex: true,
    diff,
  }
}

function groupChange(changes: ChangeNode[]): GroupChangeNode {
  return {type: 'group', key: 'group', path: [], titlePath: [], changes}
}

/**
 * Reverts `change` on a document that went from `previous` to `current`, asserts that the
 * executed patches take the document back to `previous` when applied the way the document store
 * applies them, and returns the patches as executed (one array per `patch.execute` call).
 */
function revert(
  previous: DocumentValue,
  current: DocumentValue,
  change: (rootDiff: ObjectDiff) => ChangeNode,
): PatchOperations[][] {
  const rootDiff = diffDocument(previous, current)
  const executed: PatchOperations[][] = []
  const operations: FieldOperationsAPI = {
    patch: {
      execute: (patches) => {
        executed.push(patches)
      },
    },
  }

  undoChange(change(rootDiff), rootDiff, operations)

  const mutation = new Mutation({
    mutations: executed.flat().map((patch) => ({patch: {id: 'doc', ...patch}})),
  })
  expect(mutation.apply({_id: 'doc', _type: 'doc', ...current})).toEqual({
    _id: 'doc',
    _type: 'doc',
    ...previous,
  })

  return executed
}

describe('undoChange', () => {
  it('sets a changed string back to its previous value instead of patching it', () => {
    const executed = revert({title: 'before'}, {title: 'after'}, (root) =>
      fieldChange(['title'], root.fields.title),
    )

    expect(executed).toEqual([[{set: {title: 'before'}}]])
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

  it('restores the previous order of a keyed array through sequential key swaps', () => {
    const executed = revert(
      {
        items: [
          {_key: 'item1', title: 'A'},
          {_key: 'item2', title: 'B'},
        ],
      },
      {
        items: [
          {_key: 'item2', title: 'B'},
          {_key: 'item1', title: 'A'},
        ],
      },
      (root) => fieldChange(['items'], root.fields.items),
    )

    // Both `set` groups must stay separate, in this order: the second one addresses the
    // temporary keys written by the first. No stubs are inserted for those temporary keys.
    expect(executed).toEqual([
      [
        {setIfMissing: {items: []}},
        {
          set: {
            'items[_key=="item2"]': {_key: '__temp_reorder_item2__', title: 'A'},
            'items[_key=="item1"]': {_key: '__temp_reorder_item1__', title: 'B'},
          },
        },
        {
          set: {
            'items[_key=="__temp_reorder_item2__"]._key': 'item1',
            'items[_key=="__temp_reorder_item1__"]._key': 'item2',
          },
        },
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

  it('restores a primitive array item whose current value is falsy without inserting a stub', () => {
    const executed = revert({counts: [0, 1]}, {counts: [0, 0]}, (root) =>
      fieldChange(['counts'], root.fields.counts),
    )

    expect(executed).toEqual([[{setIfMissing: {counts: []}}, {set: {'counts[1]': 1}}]])
  })

  it('removes added primitive array items as a range', () => {
    const executed = revert({tags: ['a']}, {tags: ['a', 'b', 'c']}, (root) =>
      fieldChange(['tags'], root.fields.tags),
    )

    expect(executed).toEqual([[{unset: ['tags[1:]']}]])
  })

  it('keeps the text patch when the previous string cannot be resolved from the path', () => {
    // A `_key` containing a dot does not survive `stringToPath`, so the previous value cannot be
    // looked up; the diffMatchPatch still restores the text and nothing is set to `undefined`.
    const executed = revert(
      {items: [{_key: 'dotted.key', title: 'before'}]},
      {items: [{_key: 'dotted.key', title: 'after'}]},
      (root) => fieldChange(['items'], root.fields.items),
    )

    expect(executed).toEqual([
      [{diffMatchPatch: {'items[_key=="dotted.key"].title': '@@ -1,5 +1,6 @@\n-after\n+before\n'}}],
    ])
  })
})
