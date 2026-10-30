import {describe, expect, test} from 'vitest'

import {loadFixtureReport} from './__fixtures__/loadFixtureReport'
import {
  classifyFailure,
  comparableDocument,
  comparisonDifferences,
  type FailureReplay,
  type SubmissionComparison,
  unverifiableStepsOf,
} from './compare'

const draft = {_id: 'drafts.article-gen', _type: 'article', title: 'draft'}

function comparison(overrides: Partial<SubmissionComparison> = {}): SubmissionComparison {
  return {
    submission: 0,
    transactionId: 'A-tx-1',
    recorded: {statusCode: 200},
    fake: {statusCode: 200},
    real: {statusCode: 200},
    fakeDocuments: {'drafts.article-gen': draft},
    realDocuments: {'drafts.article-gen': draft},
    ...overrides,
  }
}

function replay(overrides: Partial<FailureReplay> = {}): FailureReplay {
  return {
    signature: 'lost-edits | rejected | 400 | mutationError | diffMatchPatch',
    plan: [{submission: 0, transactionId: 'A-tx-1', replay: true}],
    comparisons: [comparison()],
    unverifiableSteps: [],
    ...overrides,
  }
}

describe('comparableDocument', () => {
  test('drops the fields the server stamps and ignores key order', () => {
    const stamped = {
      title: 'draft',
      _rev: 'real-1',
      _updatedAt: '2026-10-30T00:00:00Z',
      _createdAt: '2026-10-30T00:00:00Z',
      _type: 'article',
      _id: 'drafts.article-gen',
    }
    expect(JSON.stringify(comparableDocument(stamped))).toBe(JSON.stringify(draft))
  })
})

describe('comparisonDifferences', () => {
  test('reports nothing when the outcome and every document agree', () => {
    expect(comparisonDifferences(comparison())).toEqual([])
  })

  test('reports status code, error type and document differences separately', () => {
    const differences = comparisonDifferences(
      comparison({
        fake: {statusCode: 200},
        real: {statusCode: 409, errorType: 'mutationError'},
        realDocuments: {'drafts.article-gen': {...draft, title: 'other'}},
      }),
    )
    expect(differences).toEqual([
      {submission: 0, transactionId: 'A-tx-1', field: 'statusCode', fake: 200, real: 409},
      {
        submission: 0,
        transactionId: 'A-tx-1',
        field: 'errorType',
        fake: null,
        real: 'mutationError',
      },
      {
        submission: 0,
        transactionId: 'A-tx-1',
        field: 'document',
        documentId: 'drafts.article-gen',
        fake: draft,
        real: {...draft, title: 'other'},
      },
    ])
  })

  test('treats a document missing on one side as a difference', () => {
    const differences = comparisonDifferences(comparison({realDocuments: {}}))
    expect(differences).toMatchObject([{field: 'document', fake: draft, real: null}])
  })
})

describe('classifyFailure', () => {
  test('confirms a failure whose replayed rejection the real server agrees with', () => {
    const rejected = {statusCode: 400, errorType: 'mutationError'}
    const verdict = classifyFailure(
      replay({comparisons: [comparison({recorded: rejected, fake: rejected, real: rejected})]}),
    )
    expect(verdict).toEqual({
      signature: 'lost-edits | rejected | 400 | mutationError | diffMatchPatch',
      verdict: 'confirmed',
      summary:
        "The real Content Lake answered 400 mutationError for submission 0, as the fake did, and matched the fake's documents after the 1 replayed submission.",
      differences: [],
      replayed: 1,
    })
  })

  test('marks a disagreement as a fake mismatch and lists every difference', () => {
    const verdict = classifyFailure(
      replay({
        comparisons: [
          comparison(),
          comparison({submission: 1, transactionId: 'A-tx-2', real: {statusCode: 409}}),
        ],
      }),
    )
    expect(verdict.verdict).toBe('fake-mismatch')
    expect(verdict.summary).toBe(
      'The real Content Lake disagreed with the fake on 1 of 2 replayed submissions: submission 1 answered 409 where the fake answered 200.',
    )
    expect(verdict.differences).toEqual([
      {submission: 1, transactionId: 'A-tx-2', field: 'statusCode', fake: 200, real: 409},
    ])
  })

  test('keeps an agreeing failure that depends on a listener fault as assumed', () => {
    const verdict = classifyFailure(replay({unverifiableSteps: ['a dropped listener event']}))
    expect(verdict.verdict).toBe('assumed')
    expect(verdict.summary).toContain('a dropped listener event')
  })

  test('marks a failure with nothing to replay as assumed', () => {
    expect(classifyFailure(replay({plan: [], comparisons: []}))).toMatchObject({
      verdict: 'assumed',
      replayed: 0,
    })
  })

  test('reports an error when the model replay does not reproduce the recorded outcome', () => {
    const verdict = classifyFailure(
      replay({
        comparisons: [
          comparison({
            recorded: {statusCode: 400, errorType: 'mutationError'},
            real: {statusCode: 409},
          }),
        ],
      }),
    )
    expect(verdict).toMatchObject({verdict: 'error', differences: []})
    expect(verdict.summary).toContain('recorded 400 mutationError, replayed 200')
  })
})

describe('unverifiableStepsOf', () => {
  test('names listener faults and injected rejections once each', () => {
    const [, dropped, injected, clientOnly] = loadFixtureReport().failures
    expect(unverifiableStepsOf(dropped)).toEqual(['a dropped listener event'])
    expect(unverifiableStepsOf(injected)).toEqual(['an injected 409 rejection'])
    expect(unverifiableStepsOf(clientOnly)).toEqual([])
  })
})
