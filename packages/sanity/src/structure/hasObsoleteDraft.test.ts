import {type TargetDocumentState, type VersionInfoDocumentStub} from 'sanity'
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

const draftSibling: VersionInfoDocumentStub = {
  _id: 'drafts.doc-1',
  _rev: 'rev-1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  _type: 'article',
  _system: {
    bundleId: 'drafts',
    group: {_ref: 'doc-1', _weak: true},
  },
}

const resolvingState: TargetDocumentState = {status: 'resolving'}

const variantDefinitionNotFoundState: TargetDocumentState = {
  status: 'variant-definition-document-not-found',
  requestedVariantName: 'missing-variant',
}

function readyState(
  draft: VersionInfoDocumentStub | undefined,
): Extract<TargetDocumentState, {status: 'ready'}> {
  return {
    status: 'ready',
    targetDocument: draft,
    scopeId: undefined,
    variant: undefined,
    siblings: {published: undefined, draft, version: undefined},
  }
}

function variantMissingState(
  draft: VersionInfoDocumentStub | undefined,
): Extract<TargetDocumentState, {status: 'variant-missing'}> {
  return {
    status: 'variant-missing',
    variant: {
      _id: '_.variants.alpha-audience',
      _type: 'system.variant',
      _createdAt: '2025-01-01T00:00:00Z',
      _updatedAt: '2025-01-01T00:00:00Z',
      _rev: 'rev-alpha',
      conditions: {audience: 'alpha'},
      priority: 0,
    },
    bundle: 'published',
    siblings: {published: undefined, draft, version: undefined},
  }
}

it('produces `undefined` result while the state is indeterminate', () => {
  expect(
    hasObsoleteDraft({
      targetDocumentState: resolvingState,
      workspace: workspaceWithDraftModelActive,
      schemaType: {},
    }).result,
  ).toBeUndefined()

  expect(
    hasObsoleteDraft({
      targetDocumentState: variantDefinitionNotFoundState,
      workspace: workspaceWithDraftModelActive,
      schemaType: {},
    }).result,
  ).toBeUndefined()
})

it('produces `false` result if there is no draft', () => {
  expect(
    hasObsoleteDraft({
      targetDocumentState: readyState(undefined),
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
      targetDocumentState: readyState(draftSibling),
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
      targetDocumentState: readyState(draftSibling),
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
      targetDocumentState: readyState(draftSibling),
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
      targetDocumentState: readyState(undefined),
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
      targetDocumentState: readyState(draftSibling),
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

it('produces `true` result for a variant-scoped draft when live-edit is active', () => {
  expect(
    hasObsoleteDraft({
      targetDocumentState: variantMissingState(draftSibling),
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
