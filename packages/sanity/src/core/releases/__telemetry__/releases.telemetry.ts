import {defineEvent} from '@sanity/telemetry'

import {type DocumentVariantType} from '../../util/getDocumentVariantType'

interface VersionInfo {
  /**
   * document type that was added
   */

  /**
   * the origin of the version created (from a draft or from a version)
   */
  documentOrigin: DocumentVariantType
}

export interface OriginInfo {
  /**
   * determines where the release was created, either from the structure view or the release plugin
   */
  origin: 'structure' | 'release-plugin'
}

export interface RevertInfo {
  /**
   * determined whether reverting a release created a new staged release, or immediately reverted
   */
  revertType: 'immediate' | 'staged'
}

/**
 * When a document (version) is successfully added to a release
 */
export const AddedVersion = defineEvent<VersionInfo>({
  name: 'Version Document Added to Release ',
  version: 1,
  description: 'User added a document to a release',
})

/** When a release is successfully created */
export const CreatedRelease = defineEvent<OriginInfo>({
  name: 'Release Created',
  version: 1,
  description: 'User created a release',
})

/** When a release is successfully updated */
export const UpdatedRelease = defineEvent({
  name: 'Release Updated',
  version: 1,
  description: 'User updated a release',
})

/** When a release is successfully deleted */
export const DeletedRelease = defineEvent({
  name: 'Release Deleted',
  version: 1,
  description: 'User deleted a release',
})

/** When a release is successfully published */
export const PublishedRelease = defineEvent({
  name: 'Release Published',
  version: 1,
  description: 'User published a release',
})

/** When a release is successfully scheduled*/
export const ScheduledRelease = defineEvent({
  name: 'Release Scheduled',
  version: 1,
  description: 'User scheduled a release',
})

/** When a release is successfully scheduled */
export const UnscheduledRelease = defineEvent({
  name: 'Release Unscheduled',
  version: 1,
  description: 'User unscheduled a release',
})

/** When a release is successfully archived*/
export const ArchivedRelease = defineEvent({
  name: 'Release Archived',
  version: 1,
  description: 'User archived a release',
})

/** When a release is successfully unarchived */
export const UnarchivedRelease = defineEvent({
  name: 'Release Unarchived',
  version: 1,
  description: 'User unarchived a release',
})

/** When a release is successfully reverted */
export const RevertRelease = defineEvent<RevertInfo>({
  name: 'Release Reverted',
  version: 1,
  description: 'User reverted a release',
})
