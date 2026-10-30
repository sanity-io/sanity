import {describe, expect, test} from 'vitest'

import {loadFixtureReport} from './__fixtures__/loadFixtureReport'
import {errorTypeOf, recordedOutcome, replayOnModel, replayPlan} from './modelReplay'
import {documentIdsOf} from './namespace'

const [removedField, , injected, , liveEdit] = loadFixtureReport().failures

describe('replayPlan', () => {
  test('skips injected and never-answered submissions', () => {
    const pending = {...injected.submissions[1], outcome: 'pending' as const}
    expect(replayPlan({...injected, submissions: [...injected.submissions, pending]})).toEqual([
      {submission: 0, transactionId: 'A-tx-1', replay: false, reason: 'injected'},
      {submission: 1, transactionId: 'A-tx-2', replay: true},
      {submission: 2, transactionId: 'A-tx-2', replay: false, reason: 'pending'},
    ])
  })
})

describe('errorTypeOf', () => {
  test('reads the type from a wrapped or a bare error body', () => {
    expect(errorTypeOf({error: {type: 'mutationError'}})).toBe('mutationError')
    expect(errorTypeOf({type: 'httpBadRequest'})).toBe('httpBadRequest')
    expect(errorTypeOf('Bad gateway')).toBeUndefined()
  })
})

describe('recordedOutcome', () => {
  test('reads accepted submissions as 200 and rejections from the response body', () => {
    expect(recordedOutcome(removedField.submissions[0])).toEqual({statusCode: 200})
    expect(recordedOutcome(removedField.submissions[1])).toEqual({
      statusCode: 400,
      errorType: 'mutationError',
    })
  })
})

describe('replayOnModel', () => {
  test('rejects a diffMatchPatch on a field removed by an earlier submission', () => {
    const steps = replayOnModel(removedField, documentIdsOf(removedField))
    expect(steps.map(({outcome}) => outcome)).toEqual([
      {statusCode: 200},
      {statusCode: 400, errorType: 'mutationError'},
    ])
    expect(steps[1].documents['drafts.article-gen']).not.toHaveProperty('title')
  })

  test('chains revision preconditions through the fake transaction ids', () => {
    const steps = replayOnModel(liveEdit, documentIdsOf(liveEdit))
    expect(steps.map(({outcome}) => outcome.statusCode)).toEqual([200, 200, 409])
    expect(steps[2].documents['article-gen']).toMatchObject({title: 'live one', _rev: 'A-tx-2'})
  })
})
