import {expect, test} from 'vitest'

import {Document, Mutation} from '../src/document'
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

/** The local mutation a retry sends again, under the transaction id of its first attempt. */
const retriedSetTitle = () =>
  new Mutation({
    transactionId: 't2',
    resultRev: 't2',
    mutations: [{patch: {id: 'a', set: {title: 'Hello!'}}}],
  })

const retriedIncrement = (previousRev?: string) =>
  new Mutation({
    transactionId: 't2',
    resultRev: 't2',
    ...(previousRev && {previousRev}),
    mutations: [{patch: {id: 'a', inc: {count: 1}}}],
  })

test('a retried mutation whose echo already arrived is not applied again', () => {
  // The first attempt lands, but its response is lost: the attempt is reported as failed, then
  // the server's echo arrives. The retry reuses the transaction id and is answered as already
  // existing, which is reported as success.
  const doc = new Document({_id: 'a', _type: 't', _rev: '1', title: 'Hello'})

  doc.stage(retriedSetTitle()).failure()
  doc.arrive(
    new Mutation({
      transactionId: 't2',
      resultRev: 't2',
      previousRev: '1',
      mutations: [{patch: {id: 'a', set: {title: 'Hello!'}}}],
    }),
  )
  doc.stage(retriedSetTitle()).success()

  expect(doc.submitted).toHaveLength(0)
  expect(doc.pending).toHaveLength(0)
  expect(doc.EDGE).toMatchObject({title: 'Hello!', _rev: 't2'})
  expect(doc.isConsistent()).toBe(true)
})

test('a retried mutation is not applied again when another mutation arrived after its echo', () => {
  // As above, but another user's mutation lands on top of the echo before the retry is
  // answered, so HEAD's revision is no longer the retried transaction's id.
  const doc = new Document({_id: 'a', _type: 't', _rev: '1', count: 0})

  doc.stage(retriedIncrement()).failure()
  doc.arrive(retriedIncrement('1'))
  doc.arrive(
    new Mutation({
      transactionId: 'b1',
      resultRev: 'b1',
      previousRev: 't2',
      mutations: [{patch: {id: 'a', set: {title: 'Other'}}}],
    }),
  )
  const retry = doc.stage(retriedIncrement())
  // While the retry is in flight, the local view already has its echo and does not apply it again.
  expect(doc.EDGE).toMatchObject({count: 1})
  retry.success()

  expect(doc.submitted).toHaveLength(0)
  expect(doc.pending).toHaveLength(0)
  expect(doc.EDGE).toMatchObject({count: 1, title: 'Other', _rev: 'b1'})
  expect(doc.isConsistent()).toBe(true)
})

test('a retried mutation is not applied again when a snapshot reset already includes it', () => {
  // The document is reset from a snapshot taken after the first attempt landed, so its echo never
  // arrives as a mutation. Another user's mutation then moves HEAD past the snapshot's revision.
  const doc = new Document({_id: 'a', _type: 't', _rev: '1', count: 0})

  doc.stage(retriedIncrement()).failure()
  doc.reset({_id: 'a', _type: 't', _rev: 't2', count: 1})
  doc.arrive(
    new Mutation({
      transactionId: 'b1',
      resultRev: 'b1',
      previousRev: 't2',
      mutations: [{patch: {id: 'a', set: {title: 'Other'}}}],
    }),
  )
  doc.stage(retriedIncrement()).success()

  expect(doc.submitted).toHaveLength(0)
  expect(doc.EDGE).toMatchObject({count: 1, title: 'Other', _rev: 'b1'})
  expect(doc.isConsistent()).toBe(true)
})

test('remembers the most recent 1000 applied transaction ids', () => {
  const doc = new Document({_id: 'a', _type: 't', _rev: '0', count: 0})
  for (let i = 1; i <= 1001; i++) {
    doc.arrive(
      new Mutation({
        transactionId: `r${i}`,
        resultRev: `r${i}`,
        previousRev: i === 1 ? '0' : `r${i - 1}`,
        mutations: [{patch: {id: 'a', inc: {count: 1}}}],
      }),
    )
  }

  // The initial revision and 1001 mutations: the two oldest are forgotten.
  expect(doc.appliedTransactionIds.size).toBe(1000)
  expect(doc.appliedTransactionIds.has('0')).toBe(false)
  expect(doc.appliedTransactionIds.has('r1')).toBe(false)
  expect(doc.appliedTransactionIds.has('r2')).toBe(true)
  expect(doc.appliedTransactionIds.has('r1001')).toBe(true)
})
