import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../../../core/releases/store/types'
import {getScheduledDraftForLane} from '../useScheduledDraftParam'

const VARIANT_ID = '_.variants.loyal'
const RELEASE = 'rScheduled'

function createStub(
  _id: string,
  system: Omit<VersionInfoDocumentStub['_system'], 'group'>,
): VersionInfoDocumentStub {
  return {
    _id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: 'article',
    _system: {group: {_ref: 'doc-1', _weak: true}, ...system},
  }
}

const baseScheduledVersion = createStub(`versions.${RELEASE}.doc-1`, {bundleId: RELEASE})
const variantScheduledVersion = createStub('versions.scope-loyal.doc-1', {
  bundleId: RELEASE,
  scopeId: 'scope-loyal',
  variants: [{_ref: VARIANT_ID, _key: 'loyal'}],
})
const baseDraft = createStub('drafts.doc-1', {bundleId: 'drafts'})

const resolved = {versionsLoading: false, variantRequested: false, variantId: undefined}
const loyalSelected = {versionsLoading: false, variantRequested: true, variantId: VARIANT_ID}

describe('getScheduledDraftForLane', () => {
  it('is undefined without a scheduled draft param', () => {
    expect(
      getScheduledDraftForLane({...resolved, scheduledDraft: undefined, versions: [baseDraft]}),
    ).toBeUndefined()
  })

  it('keeps the param while the versions load', () => {
    expect(
      getScheduledDraftForLane({
        ...loyalSelected,
        versionsLoading: true,
        scheduledDraft: RELEASE,
        versions: [],
      }),
    ).toBe(RELEASE)
  })

  it('keeps the param while the requested variant resolves', () => {
    expect(
      getScheduledDraftForLane({
        ...loyalSelected,
        variantId: undefined,
        scheduledDraft: RELEASE,
        versions: [baseScheduledVersion],
      }),
    ).toBe(RELEASE)
  })

  it('keeps the param when no version of the release is known yet', () => {
    expect(
      getScheduledDraftForLane({...loyalSelected, scheduledDraft: RELEASE, versions: [baseDraft]}),
    ).toBe(RELEASE)
  })

  it('keeps a scheduled draft of the base document on Default', () => {
    expect(
      getScheduledDraftForLane({
        ...resolved,
        scheduledDraft: RELEASE,
        versions: [baseDraft, baseScheduledVersion],
      }),
    ).toBe(RELEASE)
  })

  it('keeps a scheduled draft of the selected variant', () => {
    expect(
      getScheduledDraftForLane({
        ...loyalSelected,
        scheduledDraft: RELEASE,
        versions: [baseDraft, variantScheduledVersion],
      }),
    ).toBe(RELEASE)
  })

  it('drops a scheduled draft of the base document while a variant is selected', () => {
    expect(
      getScheduledDraftForLane({
        ...loyalSelected,
        scheduledDraft: RELEASE,
        versions: [baseDraft, baseScheduledVersion],
      }),
    ).toBeUndefined()
  })

  it('drops a scheduled draft of a variant on Default', () => {
    expect(
      getScheduledDraftForLane({
        ...resolved,
        scheduledDraft: RELEASE,
        versions: [baseDraft, variantScheduledVersion],
      }),
    ).toBeUndefined()
  })

  it('drops a scheduled draft of another variant', () => {
    expect(
      getScheduledDraftForLane({
        ...loyalSelected,
        variantId: '_.variants.new',
        scheduledDraft: RELEASE,
        versions: [variantScheduledVersion],
      }),
    ).toBeUndefined()
  })
})
