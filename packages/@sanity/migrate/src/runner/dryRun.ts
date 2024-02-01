import {SanityDocument} from '@sanity/types'
import {APIConfig, Migration} from '../types'
import {fromExportEndpoint, safeJsonParser} from '../sources/fromExportEndpoint'
import {fromExportArchive} from '../sources/fromExportArchive'
import {streamToAsyncIterator} from '../utils/streamToAsyncIterator'
import {bufferThroughFile} from '../fs-webstream/bufferThroughFile'
import {asyncIterableToStream} from '../utils/asyncIterableToStream'
import {parse, stringify} from '../it-utils/ndjson'
import {decodeText} from '../it-utils'
import {collectMigrationMutations} from './collectMigrationMutations'
import {createBufferFile} from './utils/getBufferFile'
import {createFilteredDocumentsClient} from './utils/createFilteredDocumentsClient'
import {applyFilters} from './utils/applyFilters'
import {createContextClient} from './utils/createContextClient'

interface MigrationRunnerOptions {
  api: APIConfig
  exportPath?: string
}

export async function* dryRun(config: MigrationRunnerOptions, migration: Migration) {
  const source = config.exportPath
    ? fromExportArchive(config.exportPath)
    : streamToAsyncIterator(
        await fromExportEndpoint({...config.api, documentTypes: migration.documentTypes}),
      )

  const filteredDocuments = applyFilters(
    migration,
    parse<SanityDocument>(decodeText(source), {parse: safeJsonParser}),
  )

  const abortController = new AbortController()

  const createReader = bufferThroughFile(
    asyncIterableToStream(stringify(filteredDocuments)),
    await createBufferFile(),
    {signal: abortController.signal},
  )

  // Create a client exposed to the migration script. This will have a max concurrency of 10
  const client = createContextClient({...config.api, useCdn: false})

  const filteredDocumentsClient = createFilteredDocumentsClient(createReader)
  const context = {
    client,
    filtered: filteredDocumentsClient,
  }

  yield* collectMigrationMutations(
    migration,
    () => parse(decodeText(streamToAsyncIterator(createReader())), {parse: safeJsonParser}),
    context,
  )

  // stop buffering the export once we're done collecting all mutations
  abortController.abort()
}
