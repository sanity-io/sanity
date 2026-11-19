import {definePlugin} from '../../config/definePlugin'
import {type ReleaseMetadataConfig} from '../../config/types'
import {RELEASE_DOCUMENT_TYPE_NAME, releaseSchema} from '../schema/release'
import {releaseMetadataSchema} from '../schema/releaseMetadata'
import resolveDocumentActions from './documentActions'

/**
 * @internal
 */
export const RELEASES_NAME = 'sanity/releases'

/**
 * @internal
 */
export const RELEASES_INTENT = 'release'

/**
 * Adds the `system.release` document type and the `sanity.releaseMetadata` object type, with
 * the metadata the workspace and its plugins configure in `releases.metadata`.
 *
 * @internal
 */
export const releases = definePlugin((metadata: ReleaseMetadataConfig | undefined) => ({
  name: RELEASES_NAME,
  schema: {
    types: [releaseSchema, releaseMetadataSchema(metadata)],
    templates: (prev) =>
      prev.filter((template) => template.schemaType !== RELEASE_DOCUMENT_TYPE_NAME),
  },
  document: {
    actions: (actions, context) => resolveDocumentActions(actions, context),
  },
}))
