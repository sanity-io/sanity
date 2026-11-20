import {type FormDocumentValue} from '../../form/types/formDocumentValue'
import {RELEASE_METADATA_FORM_ID, RELEASE_METADATA_TYPE_NAME} from './compileReleaseMetadataType'
import {readFieldValues, type ReleaseMetadataRecord} from './mergeReleaseMetadata'

export function formValueFromMetadata(
  metadata: ReleaseMetadataRecord,
  fieldNames: readonly string[],
): FormDocumentValue {
  return {
    _id: RELEASE_METADATA_FORM_ID,
    _type: RELEASE_METADATA_TYPE_NAME,
    ...readFieldValues(metadata, fieldNames),
  }
}
