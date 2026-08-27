import {expect, it} from 'vitest'

import {type Context, hasObsoleteDraft} from './hasObsoleteDraft'

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
      ready: false,
      draftExists: false,
      workspace: workspaceWithDraftModelActive,
      schemaType: {},
    }).result,
  ).toBeUndefined()
})

it('produces `false` result if there is no draft', () => {
  expect(
    hasObsoleteDraft({
      ready: true,
      draftExists: false,
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
      ready: true,
      draftExists: true,
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
      ready: true,
      draftExists: true,
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
      ready: true,
      draftExists: true,
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

it('produces `false` result if live-edit is active but no draft exists', () => {
  expect(
    hasObsoleteDraft({
      ready: true,
      draftExists: false,
      workspace: workspaceWithDraftModelActive,
      schemaType: {
        liveEdit: true,
      },
    }),
  ).toEqual({
    result: false,
  })
})

it('follows the precedence of `DRAFT_MODEL_INACTIVE`, `LIVE_EDIT_ACTIVE`', () => {
  expect(
    hasObsoleteDraft({
      ready: true,
      draftExists: true,
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
