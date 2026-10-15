import {describe, expect, it} from 'vitest'

import {mergeReleaseMetadata, type ReleaseMetadataRecord} from '../mergeReleaseMetadata'

const metadata: ReleaseMetadataRecord = {
  title: 'Spring',
  description: 'A drop',
  releaseType: 'asap',
  cardinality: 'many',
  reviewer: {team: 'legal'},
  tags: ['draft'],
}

describe('mergeReleaseMetadata', () => {
  it('preserves unknown keys and overlays configured field values', () => {
    expect(
      mergeReleaseMetadata(
        metadata,
        {_id: 'form', _type: 'release.metadata', legalReview: 'reviewed'},
        ['legalReview'],
      ),
    ).toEqual({
      ...metadata,
      legalReview: 'reviewed',
    })
  })

  it('does not let a form value overwrite a reserved key', () => {
    expect(
      mergeReleaseMetadata(metadata, {title: 'Overwritten', legalReview: 'notReviewed'}, [
        'title',
        'legalReview',
      ]),
    ).toEqual({
      ...metadata,
      legalReview: 'notReviewed',
    })
  })

  it('removes a configured field when the form value no longer has it', () => {
    expect(
      mergeReleaseMetadata({...metadata, legalReview: 'notReviewed'}, {_id: 'form'}, [
        'legalReview',
      ]),
    ).toEqual(metadata)
  })
})
