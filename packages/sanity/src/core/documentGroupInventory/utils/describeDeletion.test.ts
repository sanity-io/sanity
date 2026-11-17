import {describe, expect, it} from 'vitest'

import {describeDeletion} from './describeDeletion'

const DEFAULT_ID = 'book-lighthouse'
const DRAFT_ID = `drafts.${DEFAULT_ID}`
const VARIANT_DRAFT_ID = `versions.scope-a.${DEFAULT_ID}`

describe('describeDeletion', () => {
  it('never blocks versions other than the Default', () => {
    const description = describeDeletion({
      selectedIds: [VARIANT_DRAFT_ID],
      variantIds: ['_.variants.de-DE'],
    })
    expect(description).toEqual({
      includesDefault: false,
      deletableIds: [VARIANT_DRAFT_ID],
      blockedIds: [],
      blockingVariantCount: 0,
    })
  })

  it('blocks the Default while variants exist, and lets the other versions go', () => {
    const description = describeDeletion({
      selectedIds: [DEFAULT_ID, VARIANT_DRAFT_ID],
      variantIds: ['_.variants.de-DE', '_.variants.members'],
    })
    expect(description).toEqual({
      includesDefault: true,
      deletableIds: [VARIANT_DRAFT_ID],
      blockedIds: [DEFAULT_ID],
      blockingVariantCount: 2,
    })
  })

  it('blocks the Default even when every variant version is selected with it', () => {
    // The rule looks at the variants that exist, not at what stays: two steps.
    const description = describeDeletion({
      selectedIds: [DEFAULT_ID, VARIANT_DRAFT_ID],
      variantIds: ['_.variants.de-DE'],
    })
    expect(description).toMatchObject({deletableIds: [VARIANT_DRAFT_ID], blockedIds: [DEFAULT_ID]})
  })

  it('lets the Default go once no variants exist', () => {
    const description = describeDeletion({
      selectedIds: [DEFAULT_ID, DRAFT_ID],
      variantIds: [],
    })
    expect(description).toEqual({
      includesDefault: true,
      deletableIds: [DEFAULT_ID, DRAFT_ID],
      blockedIds: [],
      blockingVariantCount: 0,
    })
  })
})
