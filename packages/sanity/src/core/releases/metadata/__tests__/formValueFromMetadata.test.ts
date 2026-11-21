import {describe, expect, it} from 'vitest'

import {RELEASE_METADATA_FORM_ID, RELEASE_METADATA_TYPE_NAME} from '../compileReleaseMetadataType'
import {formValueFromMetadata} from '../formValueFromMetadata'
import {type ReleaseMetadataRecord} from '../mergeReleaseMetadata'

const metadata: ReleaseMetadataRecord = {
  title: 'Spring',
  releaseType: 'asap',
  category: 'launch',
  reviewer: {team: 'legal'},
  unconfigured: 'ignored',
}

describe('formValueFromMetadata', () => {
  it('builds the synthetic flat document from the configured fields only', () => {
    expect(formValueFromMetadata(metadata, ['category', 'reviewer'])).toEqual({
      _id: RELEASE_METADATA_FORM_ID,
      _type: RELEASE_METADATA_TYPE_NAME,
      category: 'launch',
      reviewer: {team: 'legal'},
    })
  })

  it('omits configured fields that have no value', () => {
    expect(formValueFromMetadata(metadata, ['category', 'region'])).toEqual({
      _id: RELEASE_METADATA_FORM_ID,
      _type: RELEASE_METADATA_TYPE_NAME,
      category: 'launch',
    })
  })

  it('returns only the identity keys when no field is configured', () => {
    expect(formValueFromMetadata(metadata, [])).toEqual({
      _id: RELEASE_METADATA_FORM_ID,
      _type: RELEASE_METADATA_TYPE_NAME,
    })
  })
})
