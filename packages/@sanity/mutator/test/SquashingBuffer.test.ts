import {test} from 'tap'
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

function assertNoStashedOperations(tap, sb) {
  tap.assert(sb.out.length === 0, 'There should not be any stashed changes yet')
}

test('basic optimization of assignments to same, explicit key', (tap) => {
  const sb = new SquashingBuffer({_id: '1', _type: 'test', a: 'A string value'})
  patch(sb, {id: '1', set: {a: 'A strong value'}})
  assertNoStashedOperations(tap, sb)
  tap.same(sb.setOperations, {
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
  tap.same(Object.keys(sb.setOperations), ['a'], 'Should still only be one patch')
  patch(sb, {id: '1', set: {a: 'A string value'}})
  tap.same(
    Object.keys(sb.setOperations),
    [],
    'Should not be any set operations, because that last one should occlude the preceding operations and also be eliminated'
  )
  tap.end()
})

test('optimisation of assignments to same key with aliases', (tap) => {
  const sb = new SquashingBuffer({_id: '1', _type: 'test', a: 'A string value'})
  patch(sb, {id: '1', set: {a: 'A strange value'}})
  patch(sb, {id: '1', set: {'..a': 'A strong value'}})
  patch(sb, {id: '1', set: {"['a']": 'A strict value'}})
  tap.same(
    Object.keys(sb.setOperations),
    ['a'],
    'Should only be one key, since every operation above hits the same concrete path'
  )
  tap.end()
})

test('assigning non-string values to string field', (tap) => {
  const initial = {_id: '1', _type: 'test', a: 'A string value'}
  const sb = new SquashingBuffer(initial)
  patch(sb, {id: '1', set: {a: 42}})
  const mut = sb.purge('txn_id')
  const final = mut.apply(initial)
  tap.same(final.a, 42)
  tap.end()
})

test('stashing of changes when unoptimizable operations arrive', (tap) => {
  const initial = {_id: '1', _type: 'test', a: 'A string value', c: 'Some value'}
  const sb = new SquashingBuffer(initial)
  patch(sb, {id: '1', set: {a: 'Another value'}})
  patch(sb, {id: '1', set: {a: {b: 'A wrapped value'}}})
  tap.true(sb.out, 'There should be a stashed mutation since that last patch was not optimisable')
  tap.same(
    Object.keys(sb.setOperations),
    [],
    'All setOperation should be stashed now, so we should not see them in the optimization buffer'
  )
  patch(sb, {id: '1', set: {c: 'Change after stash'}})
  const mut = sb.purge('txn_id')
  const final = mut.apply(initial)
  tap.same(
    final,
    {
      _id: '1',
      _type: 'test',
      _rev: 'txn_id',
      a: {
        b: 'A wrapped value',
      },
      c: 'Change after stash',
    },
    'The mutations did not apply correctly'
  )
  tap.end()
})

test('de-duplicate createIfNotExists', (tap) => {
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
  tap.same(1, creates.length, 'Only a single create mutation expected')

  // And that the final state still applies:
  const final = tx.apply(initial)
  tap.same(
    final,
    {
      _id: '1',
      _type: 'test',
      _rev: 'txn_id',
      a: {
        b: 'A wrapped value',
      },
      c: 'Some value',
    },
    'The mutations did not apply correctly'
  )

  // Make sure a new patch is respected:
  add(sb, {createIfNotExists: {_id: '1', _type: 'test', a: 'A string value', c: 'Changed'}})
  const tx2 = sb.purge('txn_id')
  tap.same(1, tx2.mutations.length)

  tap.end()
})

test('de-duplicate create respects deletes', (tap) => {
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
  tap.same(2, creates.length, 'Only a single create mutation expected')

  // And that the final state still applies:
  const final = tx.apply(initial)
  tap.same(
    final,
    {
      _id: '1',
      _type: 'test',
      _createdAt: '2021-01-01T12:34:55Z',
      _updatedAt: '2021-01-01T12:34:55Z',
      _rev: 'txn_id',
      a: {
        b: 'A wrapped value',
      },
      c: 'Changed',
    },
    'The mutations did not apply correctly'
  )

  tap.end()
})

test('de-duplicate create respects rebasing', (tap) => {
  const initial = {_id: '1', _type: 'test', a: 'A string value', c: 'Some value'}
  const sb = new SquashingBuffer(initial)
  add(sb, {createIfNotExists: {_id: '1', _type: 'test', a: 'A string value', c: 'Some value'}})
  sb.rebase(initial)

  add(sb, {createIfNotExists: {_id: '1', _type: 'test', a: 'A string value', c: 'Changed'}})
  patch(sb, {id: '1', set: {a: 'Another value'}})
  patch(sb, {id: '1', set: {a: {b: 'A wrapped value'}}})

  const tx = sb.purge('txn_id')
  const creates = tx.mutations.filter((mut) => !!mut.createIfNotExists)
  tap.same(1, creates.length, 'Only a single create mutation expected')
  const final = tx.apply(initial)
  tap.same(
    final,
    {
      _id: '1',
      _type: 'test',
      _rev: 'txn_id',
      a: {
        b: 'A wrapped value',
      },
      c: 'Some value',
    },
    'The mutations did not apply correctly'
  )
  tap.end()
})

test('rebase with generated diff-match-patches', (tap) => {
  const sb = new SquashingBuffer({_id: '1', _type: 'test', a: 'A string value'})
  patch(sb, {id: '1', set: {a: 'A strong value'}})
  const initial = {_id: '1', _type: 'test', a: 'A rebased string value!'}
  sb.rebase(initial)
  const mut = sb.purge('txn_id')
  const final = mut.apply(initial)
  tap.same(
    final,
    {
      _id: '1',
      _type: 'test',
      _rev: 'txn_id',
      a: 'A rebased strong value!',
    },
    'The rebase then reapply did not apply correctly'
  )
  tap.end()
})

test('rebase with no local edits', (tap) => {
  const sb = new SquashingBuffer({_id: '1', _type: 'test', a: 'A string value'})
  const initial = {_id: '1', _type: 'test', a: 'A rebased string value!'}
  sb.rebase(initial)
  const mut = sb.purge('txn_id')
  tap.false(mut, 'purge should not return anything when there are no local changes')
  tap.same(
    sb.PRESTAGE,
    {
      _id: '1',
      _type: 'test',
      a: 'A rebased string value!',
    },
    'The rebase with no local edits applied incorrectly'
  )
  tap.end()
})
