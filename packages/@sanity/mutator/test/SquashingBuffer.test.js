import SquashingBuffer from '../src/document/SquashingBuffer'
import Mutation from '../src/document/Mutation'

import { test } from 'tap'

function add(sb, op) {
  const mut = new Mutation({
    mutations: [op]
  })
  sb.add(mut)
}

function patch(sb, patch) {
  add(sb, {patch: patch})
}

function assertNoStashedOperations(tap, sb) {
  tap.assertNot(sb.out, 'There should not be any stashed changes yet')
}

test('basic optimization of assignments to same, explicit key', tap => {
  const sb = new SquashingBuffer({a: 'A string value'})
  patch(sb, {set: {a: 'A strong value'}})
  assertNoStashedOperations(tap, sb)
  tap.same(sb.setOperations, {
    'a': {
      'patch': {
        'diffMatchPatch': {
          'a': '@@ -2,9 +2,9 @@\n  str\n-i\n+o\n ng v\n'
        }
      }
    }
  })
  patch(sb, {set: {a: 'A strange value'}})
  tap.same(Object.keys(sb.setOperations), ['a'], 'Should still only be one patch')
  patch(sb, {set: {a: 'A string value'}})
  tap.same(Object.keys(sb.setOperations), [],
    'Should not be any set operations, because that last one should occlude the preceding operations and also be eliminated')
  tap.end()
})

test('optimisation of assignments to same key with aliases', tap => {
  const sb = new SquashingBuffer({a: 'A string value'})
  patch(sb, {set: {a: 'A strange value'}})
  patch(sb, {set: {'..a': 'A strong value'}})
  patch(sb, {set: {"['a']": 'A strict value'}})
  tap.same(Object.keys(sb.setOperations), ['a'], 'Should only be one key, since every operation above hits the same concrete path')
  tap.end()
})

test('stashing of changes when unoptimizable operations arrive', tap => {
  const initial = {a: 'A string value', c: 'Some value'}
  const sb = new SquashingBuffer(initial)
  patch(sb, {set: {a: 'Another value'}})
  patch(sb, {set: {a: {b: 'A wrapped value'}}})
  tap.true(sb.out != null, 'There should be a stashed mutation since that last patch was not optimisable')
  tap.same(Object.keys(sb.setOperations), [], 'All setOperation should be stashed now, so we should not see them in the optimization buffer')
  patch(sb, {set: {c: 'Change after stash'}})
  const mut = sb.purge('txn_id')
  const final = mut.apply(initial)
  tap.same(final, {
    _rev: 'txn_id',
    'a': {
      'b': 'A wrapped value'
    },
    'c': 'Change after stash'
  }, 'The mutations did not apply correctly')
  tap.end()
})

test('rebase with generated diff-match-patches', tap => {
  const sb = new SquashingBuffer({a: 'A string value'})
  patch(sb, {set: {a: 'A strong value'}})
  const initial = {a: 'A rebased string value!'}
  sb.rebase(initial)
  const mut = sb.purge('txn_id')
  const final = mut.apply(initial)
  tap.same(final, {
    '_rev': 'txn_id',
    'a': 'A rebased strong value!'
  }, 'The rebase then reapply did not apply correctly')
  tap.end()
})
