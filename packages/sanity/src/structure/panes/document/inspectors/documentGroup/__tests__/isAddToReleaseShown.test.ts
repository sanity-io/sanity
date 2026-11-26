import {
  type EditStateFor,
  type ReleaseDocument,
  type SystemVariant,
  type TargetDocumentState,
} from 'sanity'
import {describe, expect, it} from 'vitest'

import {type AddToReleaseShownInput, isAddToReleaseShown} from '../isAddToReleaseShown'

const ASAP_RELEASE: ReleaseDocument = {
  _id: '_.releases.rASAP',
  _type: 'system.release',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  name: 'rASAP',
  state: 'active',
  metadata: {title: 'Summer sale', releaseType: 'asap'},
}

const SCHEDULED_RELEASE: ReleaseDocument = {
  ...ASAP_RELEASE,
  _id: '_.releases.rScheduled',
  name: 'rScheduled',
  state: 'scheduled',
  publishAt: '2026-12-15T09:00:00Z',
  metadata: {
    title: 'Holiday campaign',
    releaseType: 'scheduled',
    intendedPublishAt: '2026-12-15T09:00:00Z',
  },
}

const LOYAL: SystemVariant = {
  _id: '_.variants.loyal',
  _type: 'system.variant',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  conditions: {},
  priority: 0,
  metadata: {title: 'Loyal'},
}

const SIBLINGS = {published: undefined, draft: undefined, version: undefined}

const NOT_IN_RELEASE: TargetDocumentState = {
  status: 'ready',
  targetDocument: undefined,
  scopeId: undefined,
  variant: undefined,
  siblings: SIBLINGS,
}

const IN_RELEASE: TargetDocumentState = {
  ...NOT_IN_RELEASE,
  targetDocument: {_id: 'versions.rASAP.doc-1', _rev: 'rev'} as never,
}

const VARIANT_MISSING: TargetDocumentState = {
  status: 'variant-missing',
  variant: LOYAL,
  bundle: 'rASAP',
  siblings: SIBLINGS,
}

const EXISTING: EditStateFor = {
  id: 'doc-1',
  type: 'author',
  transactionSyncLock: null,
  draft: {_id: 'drafts.doc-1', _type: 'author', _createdAt: '', _updatedAt: '', _rev: 'r'},
  published: null,
  version: null,
  liveEdit: false,
  liveEditSchemaType: false,
  ready: true,
  release: undefined,
  scopeId: undefined,
}

function input(overrides: Partial<AddToReleaseShownInput> = {}): AddToReleaseShownInput {
  return {
    selectedPerspective: ASAP_RELEASE,
    targetDocumentState: NOT_IN_RELEASE,
    displayedId: 'drafts.doc-1',
    ready: true,
    editState: EXISTING,
    historyVersion: undefined,
    ...overrides,
  }
}

describe('isAddToReleaseShown', () => {
  it('is shown in an open release the document is not in', () => {
    expect(isAddToReleaseShown(input())).toBe(true)
  })

  it('is shown in an open release the selected variant is not in', () => {
    expect(isAddToReleaseShown(input({targetDocumentState: VARIANT_MISSING}))).toBe(true)
  })

  it('is not shown when the document is already in the release', () => {
    expect(isAddToReleaseShown(input({targetDocumentState: IN_RELEASE}))).toBe(false)
  })

  it('is not shown in Drafts or Published', () => {
    expect(isAddToReleaseShown(input({selectedPerspective: 'drafts'}))).toBe(false)
    expect(isAddToReleaseShown(input({selectedPerspective: 'published'}))).toBe(false)
  })

  it('is not shown in a scheduled release, which takes no new versions', () => {
    expect(isAddToReleaseShown(input({selectedPerspective: SCHEDULED_RELEASE}))).toBe(false)
    expect(
      isAddToReleaseShown(
        input({selectedPerspective: SCHEDULED_RELEASE, targetDocumentState: VARIANT_MISSING}),
      ),
    ).toBe(false)
  })

  it('is not shown for an archived release, a new document or while loading', () => {
    expect(isAddToReleaseShown(input({historyVersion: 'rOld'}))).toBe(false)
    expect(isAddToReleaseShown(input({editState: {...EXISTING, draft: null}}))).toBe(false)
    expect(isAddToReleaseShown(input({ready: false}))).toBe(false)
    expect(isAddToReleaseShown(input({targetDocumentState: {status: 'resolving'}}))).toBe(false)
  })
})
