import {applyPatch, type RawPatch} from 'mendoza'
import {expect, test} from 'vitest'

import {Document, Mutation} from '../src/document'
import {type Doc} from '../src/document/types'
import {DocumentTester} from './util/DocumentTester'

test('simple remote mutation', () => {
  new DocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    title: 'Hello',
  })
    .isConsistent()
    .stage('when remote patch arrive')
    .remotePatch('1', '2', {
      id: 'a',
      set: {
        title: 'Good bye',
      },
    })
    .noUnresolvedLocalMutations()
    .didNotRebase()
    .onMutationFired()
    .isConsistent()
    .assertBOTH('title', 'Good bye')
    .assertHEAD('_rev', '2')
})

test('simple local mutation arrives', () => {
  new DocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    title: 'Hello',
  })
    .isConsistent()
    .stage('when local patch is pending')
    .localPatch('1', '2', {
      id: 'a',
      set: {
        title: 'Good bye',
      },
    })
    .hasUnresolvedLocalMutations()
    .didNotRebase()
    .onMutationFired()
    .isInconsistent()
    .assertHEAD('title', 'Hello')
    .assertEDGE('title', 'Good bye')
    .stage('when local patch is was submitted')
    .localSucceeded('2')
    .hasUnresolvedLocalMutations()
    .didNotRebase()
    .onMutationDidNotFire()
    .isInconsistent()
    .stage('when local patch did arrive')
    .arrivedLocal('2')
    .assertBOTH('title', 'Good bye')
    .noUnresolvedLocalMutations()
    .didNotRebase()
    .onMutationDidNotFire()
    .isConsistent()
    .assertHEAD('_rev', '2')
})

test('local mutation submitted, but remote mutation wins the race and causes a rebase', () => {
  new DocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    count: 1,
  })
    .isConsistent()
    .localPatch('2', '3', {
      id: 'a',
      inc: {
        count: 1,
      },
    })
    .stage('when local patch is pending')
    .assertHEAD('count', 1)
    .assertEDGE('count', 2)
    .stage('when remote pach change initial count under our feet')
    .remotePatch('1', '2', {
      id: 'a',
      set: {
        count: 10,
      },
    })
    .didRebase()
    .assertHEAD('count', 10)
    .assertEDGE('count', 11)
    .onMutationDidNotFire()
    .isInconsistent()
    .stage('when local pach succeed')
    .localSucceeded('3')
    .arrivedLocal('3')
    .assertBOTH('count', 11)
    .onMutationDidNotFire()
    .didNotRebase()
    .isConsistent()
    .assertBOTH('_rev', '3')
})

test('simple local mutation failing', () => {
  new DocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    title: 'Hello',
  })
    .isConsistent()
    .stage('when local patch is pending')
    .localPatch('1', '2', {
      id: 'a',
      set: {
        title: 'Good bye',
      },
    })
    .hasUnresolvedLocalMutations()
    .didNotRebase()
    .onMutationFired()
    .isInconsistent()
    .assertHEAD('title', 'Hello')
    .assertEDGE('title', 'Good bye')
    .stage('when local patch failed to submit')
    .localFailed('2')
    .noUnresolvedLocalMutations()
    .didRebase()
    .onMutationDidNotFire()
    .isConsistent()
    .assertBOTH('title', 'Hello')
})

test('simple local mutation arriving out of order', () => {
  new DocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    numbers: [],
  })
    .isConsistent()
    .stage('when first local patch is pending')
    .localPatch('2', '3', {
      id: 'a',
      insert: {
        after: 'numbers[-1]',
        items: [1],
      },
    })
    .assertHEAD('numbers', [])
    .assertEDGE('numbers', [1])
    .localSucceeded('3')
    .stage('when second local patch is pending')
    .localPatch('1', '2', {
      id: 'a',
      insert: {
        after: 'numbers[-1]',
        items: [2],
      },
    })
    .assertHEAD('numbers', [])
    .assertEDGE('numbers', [1, 2])
    .localSucceeded('2')
    .stage('when second patch arrives first')
    .arrivedLocal('2')
    .assertHEAD('numbers', [2])
    .assertEDGE('numbers', [2, 1])
    .didRebase()
    .arrivedLocal('3')
    .didNotRebase()
    .onMutationDidNotFire()
    .isConsistent()
    .assertBOTH('numbers', [2, 1])
})

/** A document that builds HEAD from effects with Mendoza, as Studio sets it up. */
function effectsDocument(doc: Doc | null): Document {
  const document = new Document(doc)
  document.applyEffects = (base, patch) => applyPatch(base, patch as RawPatch)
  return document
}

// A real Content Lake listener event: set the title to "Hello brave world" and insert "tech" after
// the last tag. Content Lake computed the effects without `_rev`.
const effectsBase = {
  _id: 'drafts.post-1',
  _type: 'post',
  title: 'Hello world',
  tags: ['news', 'sports'],
  _createdAt: '2026-11-20T13:56:19.700Z',
  _updatedAt: '2026-11-20T13:56:19.700Z',
  _rev: 'rev-1',
}
const realEvent = (withEffects: boolean) =>
  new Mutation({
    transactionId: 'rev-2',
    previousRev: 'rev-1',
    resultRev: 'rev-2',
    // Later than the stored `_updatedAt`, to tell which one HEAD took.
    timestamp: '2026-11-20T13:56:20.000Z',
    mutations: [
      {
        patch: {
          id: 'drafts.post-1',
          set: {title: 'Hello brave world'},
          insert: {after: 'tags[-1]', items: ['tech']},
        },
      },
    ],
    ...(withEffects && {
      effects: {
        apply: [
          11,
          3,
          23,
          0,
          20,
          22,
          '811',
          23,
          23,
          24,
          15,
          11,
          4,
          21,
          0,
          2,
          20,
          'tech',
          15,
          11,
          5,
          23,
          0,
          6,
          22,
          'brave ',
          23,
          6,
          11,
          15,
        ],
        revert: [],
      },
    }),
  })

test("builds HEAD from an incoming mutation's effects, with _rev from its result", () => {
  const doc = effectsDocument(effectsBase)
  doc.arrive(realEvent(true))
  expect(doc.HEAD).toEqual({
    ...effectsBase,
    title: 'Hello brave world',
    tags: ['news', 'sports', 'tech'],
    _updatedAt: '2026-11-20T13:56:19.811Z',
    _rev: 'rev-2',
  })
})

test('builds HEAD from effects when the mutator would apply the mutations differently', () => {
  // Content Lake deep-merges a `merge` patch, which the mutator skips.
  const {_rev, ...stored} = {...effectsBase, meta: {a: 1}}
  const doc = effectsDocument(effectsBase)
  doc.arrive(
    new Mutation({
      transactionId: 'rev-2',
      previousRev: 'rev-1',
      resultRev: 'rev-2',
      mutations: [{patch: {id: 'drafts.post-1', merge: {meta: {a: 1}}}} as never],
      effects: {apply: [0, stored], revert: []},
    }),
  )
  expect(doc.HEAD).toEqual({...stored, _rev: 'rev-2'})
})

test('replays the mutations of an incoming mutation without effects', () => {
  const doc = effectsDocument(effectsBase)
  doc.arrive(realEvent(false))
  expect(doc.HEAD).toMatchObject({
    title: 'Hello brave world',
    tags: ['news', 'sports', 'tech'],
    _updatedAt: '2026-11-20T13:56:20.000Z',
    _rev: 'rev-2',
  })
})

test('replays the mutations when the effects do not apply to HEAD', () => {
  // HEAD has drifted from the revision the effects were computed on: it has no tags.
  const {tags: _tags, ...drifted} = effectsBase
  const doc = effectsDocument(drifted)
  doc.arrive(realEvent(true))
  expect(doc.HEAD).toMatchObject({title: 'Hello brave world', _rev: 'rev-2'})
})

test('builds a deleted HEAD from effects', () => {
  const doc = effectsDocument(effectsBase)
  doc.arrive(
    new Mutation({
      transactionId: 'rev-2',
      previousRev: 'rev-1',
      resultRev: 'rev-2',
      mutations: [{delete: {id: 'drafts.post-1'}}],
      effects: {apply: [0, null], revert: []},
    }),
  )
  expect(doc.HEAD).toBeNull()
})

test('replays the mutations of an incoming mutation with effects but no resulting revision', () => {
  const doc = effectsDocument(effectsBase)
  const {resultRev: _resultRev, ...withoutResultRev} = realEvent(true).params
  doc.applyIncoming(new Mutation(withoutResultRev))
  expect(doc.HEAD).toMatchObject({
    title: 'Hello brave world',
    _updatedAt: '2026-11-20T13:56:20.000Z',
  })
})

/** An event that sets `title` on `effectsBase`, with the given effect. */
const withEffect = (apply: unknown, previousRev: string | undefined = 'rev-1') =>
  new Mutation({
    transactionId: 'rev-2',
    previousRev,
    resultRev: 'rev-2',
    mutations: [{patch: {id: 'drafts.post-1', set: {title: 'Set by the mutations'}}}],
    effects: {apply, revert: []},
  })
const {_rev: _baseRev, ...storedBase} = effectsBase

test('creates HEAD from the effects of a mutation that creates the document', () => {
  const doc = effectsDocument(null)
  doc.arrive(
    new Mutation({
      transactionId: 'rev-1',
      resultRev: 'rev-1',
      mutations: [{create: {...storedBase}}],
      effects: {apply: [0, storedBase], revert: []},
    }),
  )
  expect(doc.HEAD).toEqual(effectsBase)
})

test('throws for a mutation on another revision, as without effects', () => {
  const doc = effectsDocument(effectsBase)
  expect(() => doc.applyIncoming(withEffect([0, storedBase], 'rev-0'))).toThrow('Previous revision')
})

test('does not apply effects computed against a document to a missing HEAD', () => {
  const doc = effectsDocument(null)
  expect(() => doc.applyIncoming(withEffect([0, storedBase]))).toThrow()
  expect(doc.HEAD).toBeNull()
})

test('replays the mutations when the effects are not a Mendoza patch', () => {
  const doc = effectsDocument(effectsBase)
  doc.arrive(withEffect({}))
  expect(doc.HEAD).toMatchObject({title: 'Set by the mutations', _rev: 'rev-2'})
})

test.each([
  ['a primitive', 'text'],
  ['an array', [1, 2]],
  ['a document with another _id', {...storedBase, _id: 'drafts.other'}],
  ['a document without a _type', {_id: 'drafts.post-1', title: 'x'}],
  ['a document with an undefined field', {...storedBase, undefined: 'x'}],
])('replays the mutations when the effects give %s', (_case, result) => {
  const doc = effectsDocument(effectsBase)
  doc.arrive(withEffect([0, result]))
  expect(doc.HEAD).toMatchObject({
    _id: 'drafts.post-1',
    title: 'Set by the mutations',
    _rev: 'rev-2',
  })
})

test('replays the mutations when no effect applier is set', () => {
  const doc = new Document(effectsBase)
  doc.arrive(realEvent(true))
  expect(doc.HEAD).toMatchObject({
    title: 'Hello brave world',
    _updatedAt: '2026-11-20T13:56:20.000Z',
  })
})
