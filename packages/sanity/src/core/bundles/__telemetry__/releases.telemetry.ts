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
export const CreatedRelease = defineEvent({
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
