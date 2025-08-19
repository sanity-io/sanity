import {
  type EditableReleaseDocument as BaseEditableReleaseDocument,
  type ReleaseDocument as BaseReleaseDocument,
} from '@sanity/client'

/** @internal */
export type CardinalityType = 'one' | 'many' | undefined

/** @internal */
export type ExtendedReleaseMetadata = BaseReleaseDocument['metadata'] & {
  cardinality?: CardinalityType
}

/** @beta */
export type StudioReleaseDocument = BaseReleaseDocument & {
  metadata: ExtendedReleaseMetadata
}

/** @beta */
export type EditableStudioReleaseDocument = BaseEditableReleaseDocument & {
  metadata: ExtendedReleaseMetadata
}
