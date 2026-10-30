import {describe, expect, test} from 'vitest'

import {type SubmissionComparison} from './compare'
import {type SubmissionRequest} from './contracts'
import {fakeSignatureOf, requestOperations} from './fakeSignature'

function referenceMutations(documentId: string, revision: string, target: string): unknown[] {
  return [
    {
      patch: {
        id: documentId,
        ifRevisionID: revision,
        set: {author: {_type: 'reference', _ref: target}},
      },
    },
  ]
}

function referencePatch(documentId: string, revision: string, target: string): SubmissionRequest {
  return {kind: 'mutations', mutations: referenceMutations(documentId, revision, target)}
}

function edit(patch: Record<string, unknown>) {
  return {actionType: 'sanity.action.document.edit', draftId: 'drafts.a', publishedId: 'a', patch}
}

function rejectedComparison(
  submission: number,
  documentId: string,
  overrides: Partial<SubmissionComparison> = {},
): SubmissionComparison {
  const document = {_id: documentId, _type: 'article', title: 'draft'}
  return {
    submission,
    transactionId: `tx-${documentId}`,
    recorded: {statusCode: 200},
    fake: {statusCode: 200},
    real: {statusCode: 409, errorType: 'mutationError'},
    fakeDocuments: {[documentId]: {...document, author: {_ref: 'x', _type: 'reference'}}},
    realDocuments: {[documentId]: document},
    ...overrides,
  }
}

describe('fakeSignatureOf', () => {
  test('gives the same gap the same signature whatever ids, revisions and values it used', () => {
    const first = fakeSignatureOf(
      [{request: referencePatch('drafts.article-gen', 'seed', 'missing-author')}],
      rejectedComparison(0, 'drafts.article-gen'),
    )
    const second = fakeSignatureOf(
      [
        {request: {kind: 'actions', actions: []}},
        {request: referencePatch('drafts.other-doc', 'tx-41', 'gone-person')},
      ],
      rejectedComparison(1, 'drafts.other-doc'),
    )
    expect(first).toBe('fake-mismatch | mutations | patch:set | 200->409 | mutationError')
    expect(second).toBe(first)
  })

  test('signs an outside write like a live edit, since both use the mutate endpoint', () => {
    const outside: SubmissionRequest = {
      kind: 'outside',
      mutations: referenceMutations('article-gen', 'seed', 'missing'),
    }
    expect(fakeSignatureOf([{request: outside}], rejectedComparison(0, 'article-gen'))).toBe(
      'fake-mismatch | mutations | patch:set | 200->409 | mutationError',
    )
  })

  test('names the differing top-level fields when only the documents differ', () => {
    const comparison = rejectedComparison(0, 'drafts.article-gen', {
      real: {statusCode: 200},
      realDocuments: {
        'drafts.article-gen': {_id: 'drafts.article-gen', _type: 'article', title: 'other'},
      },
    })
    expect(
      fakeSignatureOf([{request: referencePatch('drafts.article-gen', 'seed', 'x')}], comparison),
    ).toBe('fake-mismatch | mutations | patch:set | 200->200 | document:author,title')
  })

  test('names a document only one side has', () => {
    const comparison = rejectedComparison(0, 'drafts.article-gen', {
      real: {statusCode: 200},
      fakeDocuments: {'drafts.article-gen': null},
    })
    expect(
      fakeSignatureOf([{request: referencePatch('drafts.article-gen', 'seed', 'x')}], comparison),
    ).toBe('fake-mismatch | mutations | patch:set | 200->200 | document:only-real')
  })
})

describe('requestOperations', () => {
  test('lists action and patch operations once, sorted, without the empty action guard', () => {
    const request: SubmissionRequest = {
      kind: 'actions',
      actions: [
        edit({set: {title: 'one'}}),
        edit({unset: ['_empty_action_guard_pseudo_field_']}),
        edit({setIfMissing: {items: []}, insert: {after: 'items[-1]', items: []}}),
        edit({set: {title: 'two'}}),
        {actionType: 'sanity.action.document.create', publishedId: 'a', attributes: {}},
      ],
    }
    expect(requestOperations(request)).toBe(
      'document.create,document.edit:insert,document.edit:set,document.edit:setIfMissing',
    )
  })

  test('lists mutation kinds and keeps a real unset', () => {
    const request: SubmissionRequest = {
      kind: 'mutations',
      mutations: [
        {createIfNotExists: {_id: 'a', _type: 'article'}},
        {patch: {id: 'a', unset: ['title']}},
        {delete: {id: 'b'}},
      ],
    }
    expect(requestOperations(request)).toBe('createIfNotExists,delete,patch:unset')
  })
})
