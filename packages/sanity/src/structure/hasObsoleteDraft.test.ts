import {type SanityDocument} from '@sanity/types'
import {expect, it} from 'vitest'

import {type Context, hasObsoleteDraft} from './hasObsoleteDraft'

const stubDocument: SanityDocument = {
  _id: 'x',
  _rev: 'x',
  _type: 'x',
  _createdAt: '2025-06-23',
  _updatedAt: '2025-06-23',
}

const workspaceWithDraftModelActive: Context['workspace'] = {
  document: {
    drafts: {
      enabled: true,
    },
  },
}

const workspaceWithDraftModelInactive: Context['workspace'] = {
  document: {
    drafts: {
      enabled: false,
    },
  },
}

it('produces `undefined` result while the state is indeterminate', () => {
  expect(
    hasObsoleteDraft({
      editState: {
        ready: false,
        draft: null,
        version: null,
        published: null,
      },
      workspace: workspaceWithDraftModelActive,
      schemaType: {},
    }).result,
  ).toBeUndefined()
})

it('produces `false` result if there is no draft', () => {
  expect(
    hasObsoleteDraft({
      editState: {
        ready: true,
        draft: null,
        version: null,
        published: null,
      },
      workspace: workspaceWithDraftModelActive,
      schemaType: {},
    }),
  ).toEqual({
    result: false,
  })

  expect(
    hasObsoleteDraft({
      editState: {
        ready: true,
        draft: null,
        version: null,
        published: stubDocument,
      },
      workspace: workspaceWithDraftModelActive,
      schemaType: {},
    }),
  ).toEqual({
    result: false,
  })
})

it('produces `false` result if there is a draft, but there are no factors making it obsolete', () => {
  expect(
    hasObsoleteDraft({
      editState: {
        ready: true,
        draft: stubDocument,
        version: null,
        published: null,
      },
      workspace: workspaceWithDraftModelActive,
      schemaType: {},
    }),
  ).toEqual({
    result: false,
  })
})

it('produces `true` result if there is a draft, but the draft model is inactive', () => {
  expect(
    hasObsoleteDraft({
      editState: {
        ready: true,
        draft: stubDocument,
        version: null,
        published: null,
      },
      workspace: workspaceWithDraftModelInactive,
      schemaType: {},
    }),
  ).toEqual({
    result: true,
    reason: 'DRAFT_MODEL_INACTIVE',
  })
})

it('produces `true` result if there is a draft, but live-edit is active', () => {
  expect(
    hasObsoleteDraft({
      editState: {
        ready: true,
        draft: stubDocument,
        version: null,
        published: null,
      },
      workspace: workspaceWithDraftModelActive,
      schemaType: {
        liveEdit: true,
      },
    }),
  ).toEqual({
    result: true,
    reason: 'LIVE_EDIT_ACTIVE',
  })
})

it('follows the precedence of `DRAFT_MODEL_INACTIVE`, `LIVE_EDIT_ACTIVE`', () => {
  expect(
    hasObsoleteDraft({
      editState: {
        ready: true,
        draft: stubDocument,
        version: null,
        published: null,
      },
      workspace: workspaceWithDraftModelInactive,
      schemaType: {
        liveEdit: true,
      },
    }),
  ).toEqual({
    result: true,
    reason: 'DRAFT_MODEL_INACTIVE',
  })
})
