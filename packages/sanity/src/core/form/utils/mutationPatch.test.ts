import {afterEach, describe, expect, test, vi} from 'vitest'

import {
  dec,
  diffMatchPatch,
  inc,
  insert,
  SANITY_PATCH_TYPE,
  set,
  setIfMissing,
  unset,
} from '../patch/patch'
import {type FormPatch} from '../patch/types'
import {fromMutationPatches, toMutationPatches} from './mutationPatch'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('toMutationPatches', () => {
  test('returns an empty list when there are no form patches', () => {
    expect(toMutationPatches([])).toEqual([])
  })

  test('maps a nested set to a keyed mutation payload', () => {
    expect(toMutationPatches([set('Hello', ['title'])])).toEqual([{set: {title: 'Hello'}}])
  })

  test('maps a root set to the value itself rather than a blank path key', () => {
    expect(toMutationPatches([set({title: 'Hello'})])).toEqual([{set: {title: 'Hello'}}])
  })

  test('maps unset, setIfMissing, inc, dec and diffMatchPatch', () => {
    expect(
      toMutationPatches([
        unset(['title']),
        setIfMissing('x', ['slug']),
        inc(2, ['count']) as unknown as FormPatch,
        dec(1, ['count']) as unknown as FormPatch,
        diffMatchPatch('@@ -1,1 +1,2 @@\n+hi\n', ['body']),
      ]),
    ).toEqual([
      {unset: ['title']},
      {setIfMissing: {slug: 'x'}},
      {inc: {count: 2}},
      {dec: {count: 1}},
      {diffMatchPatch: {body: '@@ -1,1 +1,2 @@\n+hi\n'}},
    ])
  })

  test('maps insert before and after, including keyed and index paths', () => {
    expect(
      toMutationPatches([
        insert([{_key: 'b', title: 'B'}], 'after', ['items', {_key: 'a'}]),
        insert(['first'], 'before', ['tags', 0]),
      ]),
    ).toEqual([
      {insert: {after: 'items[_key=="a"]', items: [{_key: 'b', title: 'B'}]}},
      {insert: {before: 'tags[0]', items: ['first']}},
    ])
  })

  test('throws when patchType is missing and the patch has a type', () => {
    expect(() =>
      toMutationPatches([{type: 'set', path: ['title'], value: 'x'} as FormPatch]),
    ).toThrow('Patch is missing "patchType" - import and use "set()" from "sanity/form"')
  })

  test('throws when patchType is missing and the patch has no type', () => {
    expect(() => toMutationPatches([{path: ['title']} as FormPatch])).toThrow(
      'Patch is missing "patchType" - import and use the patch method helpers from "sanity/form"',
    )
  })

  test('throws when a typed sanity patch is missing its operation type', () => {
    expect(() =>
      toMutationPatches([{patchType: SANITY_PATCH_TYPE, path: ['title'], value: 'x'} as FormPatch]),
    ).toThrow('Missing patch type in patch')
  })
})

describe('fromMutationPatches', () => {
  test('returns an empty list when there are no mutation patches', () => {
    expect(fromMutationPatches('remote', [])).toEqual([])
  })

  test('stamps the given origin and drops id, ifRevisionID and query', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(
      fromMutationPatches('local', [
        {
          id: 'doc-1',
          ifRevisionID: 'rev-1',
          query: '*[_id == $id]',
          set: {title: 'Hello'},
        },
      ]),
    ).toEqual([{type: 'set', path: ['title'], value: 'Hello', origin: 'local'}])
    expect(warn).not.toHaveBeenCalled()
  })

  test('expands multi-path set and unset into one form patch per path', () => {
    expect(
      fromMutationPatches('remote', [
        {set: {'title': 'Hello', 'meta.count': 2}},
        {unset: ['title', 'items[0]']},
      ]),
    ).toEqual([
      {type: 'set', path: ['title'], value: 'Hello', origin: 'remote'},
      {type: 'set', path: ['meta', 'count'], value: 2, origin: 'remote'},
      {type: 'unset', path: ['title'], origin: 'remote'},
      {type: 'unset', path: ['items', 0], origin: 'remote'},
    ])
  })

  test('maps insert after, and prefers before when both positions are present', () => {
    expect(
      fromMutationPatches('internal', [
        {insert: {after: 'items[_key=="a"]', items: [{_key: 'b'}]}},
        {insert: {before: 'tags[0]', after: 'tags[-1]', items: ['first']}},
      ]),
    ).toEqual([
      {
        type: 'insert',
        position: 'after',
        path: ['items', {_key: 'a'}],
        items: [{_key: 'b'}],
        origin: 'internal',
      },
      {
        type: 'insert',
        position: 'before',
        path: ['tags', 0],
        items: ['first'],
        origin: 'internal',
      },
    ])
  })

  test('maps setIfMissing, inc, dec and diffMatchPatch', () => {
    expect(
      fromMutationPatches('remote', [
        {setIfMissing: {slug: 'x'}},
        {inc: {count: 2}},
        {dec: {count: 1}},
        {diffMatchPatch: {body: '@@ -1 +1 @@\n'}},
      ]),
    ).toEqual([
      {type: 'setIfMissing', path: ['slug'], value: 'x', origin: 'remote'},
      {type: 'inc', path: ['count'], value: 2, origin: 'remote'},
      {type: 'dec', path: ['count'], value: 1, origin: 'remote'},
      {type: 'diffMatchPatch', path: ['body'], value: '@@ -1 +1 @@\n', origin: 'remote'},
    ])
  })

  test('warns and drops unsupported mutation operations', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(fromMutationPatches('remote', [{truncate: {title: true}}])).toEqual([])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toBeInstanceOf(Error)
    expect((warn.mock.calls[0][0] as Error).message).toBe('Unsupported patch type: truncate')
  })
})

describe('roundtrip', () => {
  test('field-level form patches survive toMutationPatches then fromMutationPatches', () => {
    const patches: FormPatch[] = [
      set('Hello', ['title']),
      unset(['obsolete']),
      setIfMissing([], ['tags']),
      insert([{_key: 'n', title: 'New'}], 'after', ['items', {_key: 'a'}]),
      diffMatchPatch('@@ -1,1 +1,2 @@\n+x\n', ['body']),
      inc(3, ['count']) as unknown as FormPatch,
    ]

    expect(fromMutationPatches('remote', toMutationPatches(patches))).toEqual([
      {type: 'set', path: ['title'], value: 'Hello', origin: 'remote'},
      {type: 'unset', path: ['obsolete'], origin: 'remote'},
      {type: 'setIfMissing', path: ['tags'], value: [], origin: 'remote'},
      {
        type: 'insert',
        position: 'after',
        path: ['items', {_key: 'a'}],
        items: [{_key: 'n', title: 'New'}],
        origin: 'remote',
      },
      {type: 'diffMatchPatch', path: ['body'], value: '@@ -1,1 +1,2 @@\n+x\n', origin: 'remote'},
      {type: 'inc', path: ['count'], value: 3, origin: 'remote'},
    ])
  })

  test('incoming mutation patches do not grow a patchType, so they cannot be sent back out', () => {
    const incoming = fromMutationPatches('remote', [{set: {title: 'Hello'}}])

    expect(incoming[0]).not.toHaveProperty('patchType')
    expect(() => toMutationPatches(incoming)).toThrow(
      'Patch is missing "patchType" - import and use "set()" from "sanity/form"',
    )
  })
})
