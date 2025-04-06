import {type CliApiClient, type CliOutputter} from '@sanity/cli'

import {type ManifestExtractor} from './utils/mainfestExtractor'
import {type ManifestJsonReader} from './utils/manifestReader'

export interface SchemaStoreContext {
  output: CliOutputter
  apiClient: CliApiClient
  workDir: string
  jsonReader?: ManifestJsonReader
  manifestExtractor: ManifestExtractor
}

/**
 * There is more context locally to decide how and when to log, depending on flags;
 * we therefore let actions log as soon as possible, possibly stopping stack unwinding.
 * This gives us more control over the color and detail of the error message, as well as ensuring
 * we dont double-log errors up the chain.
 *
 * Depending on flags, store actions can fail without throwing; to allow control flow to continue,
 * even in the face of failure (--schema-required ture/false for store)
 *
 * It is up to action to make this distinction based on flags.
 *
 * However, we _do_ want to ensure correct exit code on commands (0 vs 1), so
 * CLI command chains are stopped if a store command fails.
 *
 * Invalid flags will always throw.
 *
 */
export type SchemaStoreActionResult = 'success' | 'failure'
