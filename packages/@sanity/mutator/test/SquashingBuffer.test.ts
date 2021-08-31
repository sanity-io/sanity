import SquashingBuffer from '../src/document/SquashingBuffer'
import Mutation from '../src/document/Mutation'

function add(sb, op) {
  const mut = new Mutation({
    mutations: [op],
  })
  sb.add(mut)
}

function patch(sb, patchDetails) {
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
  const final = mut.apply(initial)
  expect(final.a).toBe(42)
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
  const final = mut.apply(initial)
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
  const creates = tx.mutations.filter((mut) => !!mut.createIfNotExists)
  expect(1).toEqual(creates.length) // Only a single create mutation expected

  // And that the final state still applies:
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

  // Make sure a new patch is respected:
  add(sb, {createIfNotExists: {_id: '1', _type: 'test', a: 'A string value', c: 'Changed'}})
  const tx2 = sb.purge('txn_id')
  expect(tx2.mutations.length).toBe(1)
})

test('de-duplicate create respects deletes', () => {
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
  tx.params.timestamp = '2021-01-01T12:34:55Z'

  const creates = tx.mutations.filter((mut) => !!mut.createIfNotExists)
  expect(creates.length).toBe(2) // Only a single create mutation expected (note: bn - is this correct?)

  // And that the final state still applies:
  const final = tx.apply(initial)
  expect(final).toEqual({
    _id: '1',
    _type: 'test',
    _createdAt: '2021-01-01T12:34:55Z',
    _updatedAt: '2021-01-01T12:34:55Z',
    _rev: 'txn_id',
    a: {
      b: 'A wrapped value',
    },
    c: 'Changed',
  })
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
