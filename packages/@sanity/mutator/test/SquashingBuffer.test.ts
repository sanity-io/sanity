import {type PatchMutationOperation} from '@sanity/types'
import {expect, test, vi} from 'vitest'

import {Mutation} from '../src/document/Mutation'
import {SquashingBuffer} from '../src/document/SquashingBuffer'
import {type Mut} from '../src/document/types'

function add(sb: SquashingBuffer, op: Mut) {
  const mut = new Mutation({
    mutations: [op],
  })
  sb.add(mut)
}

function patch(sb: SquashingBuffer, patchDetails: PatchMutationOperation) {
  add(sb, {patch: patchDetails})
}

test('basic optimization of assignments to same, explicit key', () => {
  const sb = new SquashingBuffer({_id: '1', _type: 'test', a: 'A string value'})
  patch(sb, {id: '1', set: {a: 'A strong value'}})
  expect(sb.out.length === 0) // There should not be any stashed changes yet
  expect(sb.setOperations).toEqual({
    a: {
      patch: {
        id: '1',
        diffMatchPatch: {
          a: '@@ -2,9 +2,9 @@\n  str\n-i\n+o\n ng v\n',
        },
      },
    },
  })
  patch(sb, {id: '1', set: {a: 'A strange value'}})
  expect(Object.keys(sb.setOperations)).toEqual(['a']) // Should still only be one patch
  patch(sb, {id: '1', set: {a: 'A string value'}})
  expect(Object.keys(sb.setOperations)).toEqual([]) // Should not be any set operations, because that last one should occlude the preceding operations and also be eliminated
})

test('optimisation of assignments to same key with aliases', () => {
  const sb = new SquashingBuffer({_id: '1', _type: 'test', a: 'A string value'})
  patch(sb, {id: '1', set: {a: 'A strange value'}})
  patch(sb, {id: '1', set: {'..a': 'A strong value'}})
  patch(sb, {id: '1', set: {"['a']": 'A strict value'}})
  expect(Object.keys(sb.setOperations)).toEqual(['a']) //  Should only be one key, since every operation above hits the same concrete path
})

test('assigning non-string values to string field', () => {
  const initial = {_id: '1', _type: 'test', a: 'A string value'}
  const sb = new SquashingBuffer(initial)
  patch(sb, {id: '1', set: {a: 42}})
  const mut = sb.purge('txn_id')
  const final = mut && mut.apply(initial)
  expect(final?.a).toBe(42)
})

test('stashing of changes when unoptimizable operations arrive', () => {
  const initial = {_id: '1', _type: 'test', a: 'A string value', c: 'Some value'}
  const sb = new SquashingBuffer(initial)
  patch(sb, {id: '1', set: {a: 'Another value'}})
  patch(sb, {id: '1', set: {a: {b: 'A wrapped value'}}})
  expect(sb.out).toBeTruthy() // There should be a stashed mutation since that last patch was not optimisable
  expect(Object.keys(sb.setOperations)).toEqual([]) // All setOperation should be stashed now, so we should not see them in the optimization buffer

  patch(sb, {id: '1', set: {c: 'Change after stash'}})
  const mut = sb.purge('txn_id')
  const final = mut && mut.apply(initial)
  expect(final).toEqual({
    _id: '1',
    _type: 'test',
    _rev: 'txn_id',
    a: {
      b: 'A wrapped value',
    },
    c: 'Change after stash',
  })
})

test('de-duplicate createIfNotExists', () => {
  const initial = {_id: '1', _type: 'test', a: 'A string value', c: 'Some value'}
  const sb = new SquashingBuffer(initial)
  add(sb, {createIfNotExists: {_id: '1', _type: 'test', a: 'A string value', c: 'Some value'}})
  patch(sb, {id: '1', set: {a: 'Another value'}})
  patch(sb, {id: '1', set: {a: {b: 'A wrapped value'}}})
  add(sb, {createIfNotExists: {_id: '1', _type: 'test', a: 'A string value', c: 'Changed'}})
  patch(sb, {id: '1', set: {a: 'Another value'}})
  patch(sb, {id: '1', set: {a: {b: 'A wrapped value'}}})

  const tx = sb.purge('txn_id')

  // Check that one of the creates were removed:
  const creates = tx && tx.mutations.filter((mut) => 'createIfNotExists' in mut)
  expect(creates).toHaveLength(1) // Only a single create mutation expected

  // And that the final state still applies:
  const final = tx && tx.apply(initial)
  expect(final).toEqual({
    _id: '1',
    _type: 'test',
    _rev: 'txn_id',
    a: {
      b: 'A wrapped value',
    },
    c: 'Some value',
  })

  // Make sure a new patch is respected:
  add(sb, {createIfNotExists: {_id: '1', _type: 'test', a: 'A string value', c: 'Changed'}})
  const tx2 = sb.purge('txn_id')
  expect(tx2 && tx2.mutations.length).toBe(1)
})

test.each(['create', 'createIfNotExists', 'createOrReplace'])(
  '%s defaults to current created at time',
  (createFnc) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2020-01-01T12:34:55.000Z'))

    const sb = new SquashingBuffer(null)

    add(sb, {[createFnc]: {_id: '1', _type: 'test', a: 'A string value'}})

    const tx = sb.purge('txn_id')
    if (!tx) {
      throw new Error('buffer purge did not result in a mutation')
    }

    const final = tx.apply(null)

    expect(final).toEqual({
      _id: '1',
      _rev: 'txn_id',
      _createdAt: '2020-01-01T12:34:55.000Z',
      _type: 'test',
      a: 'A string value',
    })

    vi.useRealTimers()
  },
)

test('de-duplicate create respects deletes', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2020-01-01T12:34:55.000Z'))

  const initial = {_id: '1', _type: 'test', a: 'A string value', c: 'Some value'}
  const sb = new SquashingBuffer(initial)
  add(sb, {createIfNotExists: {_id: '1', _type: 'test', a: 'A string value', c: 'Some value'}})
  patch(sb, {id: '1', set: {a: 'Another value'}})
  patch(sb, {id: '1', set: {a: {b: 'A wrapped value'}}})
  add(sb, {delete: {id: '1'}})
  add(sb, {createIfNotExists: {_id: '1', _type: 'test', a: 'A string value', c: 'Changed'}})
  patch(sb, {id: '1', set: {a: 'Another value'}})
  patch(sb, {id: '1', set: {a: {b: 'A wrapped value'}}})

  const tx = sb.purge('txn_id')
  if (!tx) {
    throw new Error('buffer purge did not result in a mutation')
  }
  tx.params.timestamp = '2021-01-01T12:34:55.000Z'

  const creates = tx.mutations.filter((mut) => !!mut.createIfNotExists)
  expect(creates.length).toBe(2) // Only a single create mutation expected (note: bn - is this correct?)

  // And that the final state still applies:
  const final = tx.apply(initial)
  expect(final).toEqual({
    _id: '1',
    _type: 'test',
    _createdAt: '2020-01-01T12:34:55.000Z',
    _updatedAt: '2021-01-01T12:34:55.000Z',
    _rev: 'txn_id',
    a: {
      b: 'A wrapped value',
    },
    c: 'Changed',
  })

  vi.useRealTimers()
})

test('de-duplicate create respects rebasing', () => {
  const initial = {_id: '1', _type: 'test', a: 'A string value', c: 'Some value'}
  const sb = new SquashingBuffer(initial)
  add(sb, {createIfNotExists: {_id: '1', _type: 'test', a: 'A string value', c: 'Some value'}})
  sb.rebase(initial)

  add(sb, {createIfNotExists: {_id: '1', _type: 'test', a: 'A string value', c: 'Changed'}})
  patch(sb, {id: '1', set: {a: 'Another value'}})
  patch(sb, {id: '1', set: {a: {b: 'A wrapped value'}}})

  const tx = sb.purge('txn_id')
  if (!tx) {
    throw new Error('buffer purge did not result in a mutation')
  }

  const creates = tx.mutations.filter((mut) => !!mut.createIfNotExists)
  expect(creates.length).toBe(1) // Only a single create mutation expected
  const final = tx.apply(initial)
  expect(final).toEqual({
    _id: '1',
    _type: 'test',
    _rev: 'txn_id',
    a: {
      b: 'A wrapped value',
    },
    c: 'Some value',
  })
})

test('rebase with generated diff-match-patches', () => {
  const sb = new SquashingBuffer({_id: '1', _type: 'test', a: 'A string value'})
  patch(sb, {id: '1', set: {a: 'A strong value'}})
  const initial = {_id: '1', _type: 'test', a: 'A rebased string value!'}
  sb.rebase(initial)
  const mut = sb.purge('txn_id')
  if (!mut) {
    throw new Error('buffer purge did not result in a mutation')
  }

  const final = mut.apply(initial)
  expect(final).toEqual({
    _id: '1',
    _type: 'test',
    _rev: 'txn_id',
    a: 'A rebased strong value!',
  })
})

test('rebase with no local edits', () => {
  const sb = new SquashingBuffer({_id: '1', _type: 'test', a: 'A string value'})
  const initial = {_id: '1', _type: 'test', a: 'A rebased string value!'}
  sb.rebase(initial)
  const mut = sb.purge('txn_id')
  expect(mut).toBeFalsy() // purge should not return anything when there are no local changes
  expect(sb.PRESTAGE).toEqual({
    _id: '1',
    _type: 'test',
    a: 'A rebased string value!',
  })
})

// --- setIfMissing optimization tests ---

test('drops redundant setIfMissing when path already exists', () => {
  const initial = {_id: '1', _type: 'test', a: 'existing value'}
  const sb = new SquashingBuffer(initial)

  // setIfMissing on an existing path should be dropped entirely
  patch(sb, {id: '1', setIfMissing: {a: 'default value'}})

  expect(sb.out).toHaveLength(0)
  expect(sb.staged).toHaveLength(0)
  expect(Object.keys(sb.setOperations)).toHaveLength(0)
})

test('keeps setIfMissing when path does not exist', () => {
  const initial = {_id: '1', _type: 'test', a: 'existing value'}
  const sb = new SquashingBuffer(initial)

  // setIfMissing on a missing path should be kept
  patch(sb, {id: '1', setIfMissing: {b: 'new value'}})

  expect(sb.staged).toHaveLength(1)
  // Verify PRESTAGE was updated
  expect((sb.PRESTAGE as any).b).toBe('new value')
})

test('new path setIfMissing is staged without flushing the optimization buffer', () => {
  const initial = {_id: '1', _type: 'test', a: 'hello', b: 'world'}
  const sb = new SquashingBuffer(initial)

  // First, add an optimizable set operation
  patch(sb, {id: '1', set: {a: 'hello!'}})
  expect(Object.keys(sb.setOperations)).toHaveLength(1) // in optimization buffer

  // Now add a setIfMissing for a new path — should NOT flush the set operation
  patch(sb, {id: '1', setIfMissing: {c: 'new field'}})

  // The set operation should still be in the optimization buffer, not flushed to out
  expect(Object.keys(sb.setOperations)).toHaveLength(1)
  expect(sb.setOperations['a']).toBeTruthy()
})

test('existing path setIfMissing is dropped without flushing the optimization buffer', () => {
  const initial = {_id: '1', _type: 'test', a: 'hello', nested: {x: 1}}
  const sb = new SquashingBuffer(initial)

  // Add an optimizable set operation
  patch(sb, {id: '1', set: {a: 'hello!'}})
  expect(Object.keys(sb.setOperations)).toHaveLength(1)

  // Redundant setIfMissing on existing path — should be dropped without flushing
  patch(sb, {id: '1', setIfMissing: {nested: {}}})

  // The set operation should still be in the optimization buffer
  expect(Object.keys(sb.setOperations)).toHaveLength(1)
  expect(sb.out).toHaveLength(0) // nothing flushed
})

test('multiple redundant setIfMissing ops are dropped while preserving the final set operation', () => {
  // Simulates the real-world pattern: ObjectField wraps patches with
  // setIfMissing + prefixAll at each nesting level
  const initial = {
    _id: '1',
    _type: 'test',
    content: {
      blocks: {
        text: 'original',
      },
    },
  }
  const sb = new SquashingBuffer(initial)

  // Redundant setIfMissing for existing paths (the ObjectField chain)
  patch(sb, {id: '1', setIfMissing: {content: {}}})
  patch(sb, {id: '1', setIfMissing: {'content.blocks': {}}})

  // The actual content change
  patch(sb, {id: '1', set: {'content.blocks.text': 'updated'}})

  const mut = sb.purge('txn_id')
  const final = mut && mut.apply(initial)

  expect(final).toEqual({
    _id: '1',
    _type: 'test',
    _rev: 'txn_id',
    content: {
      blocks: {
        text: 'updated',
      },
    },
  })

  // Key assertion: the redundant setIfMissing ops should have been dropped,
  // leaving only the diffMatchPatch/set operation
  const patchOps = mut!.mutations.filter((m) => m.patch)
  expect(patchOps).toHaveLength(1) // Only the text change, no setIfMissing
})

test('setIfMissing for genuinely new path is preserved in output', () => {
  const initial = {_id: '1', _type: 'test', a: 'value'}
  const sb = new SquashingBuffer(initial)

  // setIfMissing for a path that doesn't exist — must be kept
  patch(sb, {id: '1', setIfMissing: {newField: {nested: true}}})

  // Follow with a set on the new path
  patch(sb, {id: '1', set: {'newField.name': 'test'}})

  const mut = sb.purge('txn_id')
  const final = mut && mut.apply(initial)

  expect((final as any).newField).toBeTruthy()
  expect((final as any).newField.nested).toBe(true)
})

test('setIfMissing targeting a different document is not optimized', () => {
  const initial = {_id: '1', _type: 'test', a: 'existing value'}
  const sb = new SquashingBuffer(initial)

  // Add an optimizable set operation first
  patch(sb, {id: '1', set: {a: 'updated value'}})
  expect(Object.keys(sb.setOperations)).toHaveLength(1) // in optimization buffer

  // setIfMissing with a different document ID should NOT be handled by the
  // setIfMissing optimization — it should fall through to the generic handler,
  // which flushes the optimization buffer
  patch(sb, {id: 'different-doc', setIfMissing: {a: 'default'}})

  // The generic handler calls stashStagedOperations(), flushing the buffer
  expect(Object.keys(sb.setOperations)).toHaveLength(0) // flushed
  expect(sb.out.length).toBeGreaterThan(0) // stashed to out
})

test('mixed setIfMissing: some redundant, some new — keeps only new', () => {
  const initial = {_id: '1', _type: 'test', existing: 'yes'}
  const sb = new SquashingBuffer(initial)

  // Redundant — path exists
  patch(sb, {id: '1', setIfMissing: {existing: 'default'}})
  // New — path doesn't exist
  patch(sb, {id: '1', setIfMissing: {brand_new: 'value'}})

  const mut = sb.purge('txn_id')
  // Should contain only the setIfMissing for brand_new
  const setIfMissingOps = mut!.mutations.filter((m) => m.patch && (m.patch as any).setIfMissing)
  expect(setIfMissingOps).toHaveLength(1)
  expect((setIfMissingOps[0].patch as any).setIfMissing).toHaveProperty('brand_new')
})
