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

/** @internal */
export type StudioReleaseDocument = BaseReleaseDocument & {
  metadata: ExtendedReleaseMetadata
}

/** @internal */
export type EditableStudioReleaseDocument = BaseEditableReleaseDocument & {
  metadata: ExtendedReleaseMetadata
}
