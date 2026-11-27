import {type FieldDefinition} from '@sanity/types'

import {resolveMetadataConfig} from '../metadataConfig'
import {type PluginOptions, type ReleaseMetadataConfig} from '../types'

/**
 * Resolves `releases.metadata` across plugins and the root config, with the merge rules of
 * `resolveMetadataConfig`. Unlike `releases.actions`, this runs even when the root config object
 * has no `releases` key. `fields` is always set.
 *
 * Fields named like a core metadata field are kept here: `releaseMetadataSchema` drops them
 * when it builds the schema type.
 *
 * @internal
 */
export function resolveReleaseMetadataConfig(
  config: PluginOptions,
): ReleaseMetadataConfig & {fields: FieldDefinition[]} {
  return resolveMetadataConfig(config, 'releases.metadata', (inner) => inner.releases?.metadata)
}
