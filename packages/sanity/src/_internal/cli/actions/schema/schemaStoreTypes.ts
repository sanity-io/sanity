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
