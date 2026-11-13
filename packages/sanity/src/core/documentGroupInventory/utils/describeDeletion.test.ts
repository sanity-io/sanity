import {describe, expect, it} from 'vitest'

import {type IncomingReference} from '../machines/deletionMachine'
import {describeDeletion} from './describeDeletion'

const DEFAULT_ID = 'book-lighthouse'
const VARIANT_DRAFT_ID = `versions.scope-a.${DEFAULT_ID}`
const NO_CROSS_DATASET = {totalCount: 0, references: []}

function internal(references: IncomingReference[], totalCount = references.length) {
  return {totalCount, references}
}

const REQUIRED: IncomingReference = {_id: 'a', _type: 'page', required: true, failsLater: false}
const OPTIONAL: IncomingReference = {_id: 'b', _type: 'page', required: false, failsLater: false}
const FAILS_LATER: IncomingReference = {
  _id: 'versions.rel.c',
  _type: 'page',
  required: false,
  failsLater: true,
}

describe('describeDeletion', () => {
  it('never blocks versions other than the Default', () => {
    const description = describeDeletion({
      selectedIds: [VARIANT_DRAFT_ID],
      variantIds: ['_.variants.de-DE'],
      internalReferences: internal([REQUIRED]),
      crossDatasetReferences: NO_CROSS_DATASET,
    })
    expect(description).toMatchObject({
      includesDefault: false,
      deletableIds: [VARIANT_DRAFT_ID],
      blockedIds: [],
      blockingVariantCount: 0,
      requiredLinkCount: 0,
    })
  })

  it('blocks the Default while variants exist, and lets the other versions go', () => {
    const description = describeDeletion({
      selectedIds: [DEFAULT_ID, VARIANT_DRAFT_ID],
      variantIds: ['_.variants.de-DE', '_.variants.members'],
      internalReferences: internal([]),
      crossDatasetReferences: NO_CROSS_DATASET,
    })
    expect(description).toMatchObject({
      deletableIds: [VARIANT_DRAFT_ID],
      blockedIds: [DEFAULT_ID],
      blockingVariantCount: 2,
      requiredLinkCount: 0,
    })
  })

  it('names both reasons when variants and required links block the Default', () => {
    const description = describeDeletion({
      selectedIds: [DEFAULT_ID],
      variantIds: ['_.variants.de-DE'],
      internalReferences: internal([REQUIRED, OPTIONAL]),
      crossDatasetReferences: NO_CROSS_DATASET,
    })
    expect(description).toMatchObject({
      deletableIds: [],
      blockedIds: [DEFAULT_ID],
      blockingVariantCount: 1,
      requiredLinkCount: 1,
      optionalLinkCount: 1,
    })
  })

  it('does not block on a required link held only by a release copy', () => {
    const description = describeDeletion({
      selectedIds: [DEFAULT_ID],
      variantIds: [],
      internalReferences: internal([FAILS_LATER]),
      crossDatasetReferences: NO_CROSS_DATASET,
    })
    expect(description).toMatchObject({
      deletableIds: [DEFAULT_ID],
      blockedIds: [],
      requiredLinkCount: 0,
      failsLaterCount: 1,
      optionalLinkCount: 0,
      strength: 'known',
    })
  })

  it('counts cross-dataset links as optional', () => {
    const description = describeDeletion({
      selectedIds: [DEFAULT_ID],
      variantIds: [],
      internalReferences: internal([OPTIONAL]),
      crossDatasetReferences: {totalCount: 2, references: []},
    })
    expect(description).toMatchObject({
      blockedIds: [],
      optionalLinkCount: 3,
      totalLinkCount: 3,
      strength: 'known',
    })
  })

  it('names no strength when more documents link here than were read and none read is required', () => {
    const description = describeDeletion({
      selectedIds: [DEFAULT_ID],
      variantIds: [],
      internalReferences: internal([OPTIONAL], 140),
      crossDatasetReferences: NO_CROSS_DATASET,
    })
    expect(description).toMatchObject({blockedIds: [], strength: 'partial', totalLinkCount: 140})
  })

  it('blocks when a required link is among those read, even past the cap', () => {
    const description = describeDeletion({
      selectedIds: [DEFAULT_ID],
      variantIds: [],
      internalReferences: internal([REQUIRED, OPTIONAL], 140),
      crossDatasetReferences: NO_CROSS_DATASET,
    })
    expect(description).toMatchObject({blockedIds: [DEFAULT_ID], strength: 'known'})
  })

  it('falls back to unknown when the strength was not read', () => {
    const description = describeDeletion({
      selectedIds: [DEFAULT_ID],
      variantIds: [],
      internalReferences: internal([{_id: 'a', _type: 'page'}]),
      crossDatasetReferences: NO_CROSS_DATASET,
    })
    expect(description).toMatchObject({blockedIds: [], strength: 'unknown'})
  })
})
