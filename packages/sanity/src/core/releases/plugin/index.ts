import {definePlugin} from '../../config/definePlugin'
import {type ReleaseMetadataConfig} from '../../config/types'
import {releaseSchema} from '../schema/release'
import {releaseMetadataSchema} from '../schema/releaseMetadata'
import {RELEASE_DOCUMENT_TYPE} from '../store/constants'
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
 * the metadata the workspace and its plugins configure in `releases.metadata`, resolved by
 * `getDefaultPluginsOptions`.
 *
 * @internal
 */
export const releases = definePlugin((options: {metadata?: ReleaseMetadataConfig}) => ({
  name: RELEASES_NAME,
  schema: {
    types: (prev) => [...prev, releaseSchema, releaseMetadataSchema(options.metadata)],
    templates: (prev) => prev.filter((template) => template.schemaType !== RELEASE_DOCUMENT_TYPE),
  },
  document: {
    actions: (actions, context) => resolveDocumentActions(actions, context),
  },
}))
