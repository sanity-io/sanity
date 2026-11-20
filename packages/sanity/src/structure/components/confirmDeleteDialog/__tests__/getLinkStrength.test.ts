import {describe, expect, it} from 'vitest'

import {getLinkStrength} from '../getLinkStrength'

const noCrossDataset = {totalCount: 0, references: []}

function internal(...required: Array<boolean | undefined>) {
  return {
    totalCount: required.length,
    references: required.map((value, index) => ({
      _id: `book-${index}`,
      _type: 'book',
      required: value,
    })),
  }
}

describe('getLinkStrength', () => {
  it('is required when any link is required', () => {
    expect(
      getLinkStrength({
        internalReferences: internal(false, true),
        crossDatasetReferences: noCrossDataset,
      }),
    ).toBe('required')
  })

  it('is optional when every link is known to be optional', () => {
    expect(
      getLinkStrength({
        internalReferences: internal(false, false),
        crossDatasetReferences: noCrossDataset,
      }),
    ).toBe('optional')
  })

  it('is unknown when the strength of a link could not be read', () => {
    expect(
      getLinkStrength({
        internalReferences: internal(false, undefined),
        crossDatasetReferences: noCrossDataset,
      }),
    ).toBe('unknown')
  })

  it('is unknown when more documents link to it than were listed', () => {
    const listed = internal(false)
    expect(
      getLinkStrength({
        internalReferences: {...listed, totalCount: 5},
        crossDatasetReferences: noCrossDataset,
      }),
    ).toBe('unknown')
  })

  it('is unknown when documents in other datasets link to it', () => {
    expect(
      getLinkStrength({
        internalReferences: internal(false),
        crossDatasetReferences: {totalCount: 1, references: [{projectId: 'p'}]},
      }),
    ).toBe('unknown')
  })

  it('is unknown with no links at all', () => {
    expect(
      getLinkStrength({internalReferences: internal(), crossDatasetReferences: noCrossDataset}),
    ).toBe('unknown')
  })

  it('does not block for a required link held only in a release copy', () => {
    // Content Lake allows that delete; the release fails later, which the dialog says separately
    expect(
      getLinkStrength({
        internalReferences: {
          totalCount: 1,
          references: [
            {_id: 'versions.r1.publisher', _type: 'publisher', required: false, failsLater: true},
          ],
        },
        crossDatasetReferences: noCrossDataset,
      }),
    ).toBe('optional')
  })
})
