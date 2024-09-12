import {defineEvent} from '@sanity/telemetry'

interface VersionInfo {
  /**
   * document type that was added
   */
  schemaType: string

  /**
   * the origin of the version created (from a draft or from a version)
   */
  documentOrigin: 'draft' | 'version'
}

export interface OriginInfo {
  /**
   * determines where the release was created, either from the structure view or the release plugin
   */
  origin: 'structure' | 'release-plugin'
}

/**
 * When a document (version) is successfully added to a release
 * @internal
 */
export const AddedVersion = defineEvent<VersionInfo>({
  name: 'Add version of document to release',
  version: 1,
  description: 'User added a document to a release',
})

/** When a release is successfully created
 * @internal
 */
export const CreatedRelease = defineEvent<OriginInfo>({
  name: 'Create release',
  version: 1,
  description: 'User created a release',
})

/** When a release is successfully updated
 * @internal
 */
export const UpdatedRelease = defineEvent({
  name: 'Update release',
  version: 1,
  description: 'User updated a release',
})

/** When a release is successfully deleted
 * @internal
 */
export const DeletedRelease = defineEvent({
  name: 'Delete release',
  version: 1,
  description: 'User deleted a release',
})

/** When a release is successfully published
 * @internal
 */
export const PublishedRelease = defineEvent({
  name: 'Publish release',
  version: 1,
  description: 'User published a release',
})

/** When a release is successfully archived
 * @internal
 */
export const ArchivedRelease = defineEvent({
  name: 'Archive release',
  version: 1,
  description: 'User archived a release',
})

/** When a release is successfully unarchived
 * @internal
 */
export const UnarchivedRelease = defineEvent({
  name: 'Unarchive release',
  version: 1,
  description: 'User unarchived a release',
})
