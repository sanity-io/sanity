// oxlint-disable no-console
import {readFileSync} from 'node:fs'
import path from 'node:path'
import {parseArgs} from 'node:util'

import {readEnv} from '@repo/utils'
import {type EngineConfidenceRunDocument} from '@repo/utils/engine-confidence'
import {createClient} from '@sanity/client'

import {runDocumentProblems} from './runDocument'

const METRICS_PROJECT_ID = 'mhfozd0z'
const METRICS_DATASET = 'bench'

export function parseRunDocument(rawText: string): EngineConfidenceRunDocument {
  const document = JSON.parse(rawText) as EngineConfidenceRunDocument
  const problems = runDocumentProblems(document)
  if (problems.length > 0) {
    throw new Error(`Invalid engine confidence run document:\n${problems.join('\n')}`)
  }
  return document
}

async function main(): Promise<void> {
  const {values, positionals} = parseArgs({
    options: {'dry-run': {type: 'boolean', default: false}},
    allowPositionals: true,
  })
  const [inputPathArgument] = positionals
  if (inputPathArgument === undefined) {
    console.error('Usage: engine-confidence store <file> [--dry-run]')
    process.exit(1)
  }

  let document: EngineConfidenceRunDocument
  try {
    document = parseRunDocument(readFileSync(path.resolve(inputPathArgument), 'utf8'))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  if (values['dry-run']) {
    console.log(`Would store ${document._id} in ${METRICS_PROJECT_ID}/${METRICS_DATASET}`)
    console.log(JSON.stringify(document, null, 2))
    return
  }

  const client = createClient({
    projectId: METRICS_PROJECT_ID,
    dataset: METRICS_DATASET,
    apiVersion: '2025-02-19',
    token: readEnv('RADAR_SANITY_WRITE_TOKEN'),
    useCdn: false,
  })
  try {
    const stored = await client.createOrReplace(document)
    console.log(
      `Stored ${stored._id} (${document.isoWeek}) in ${METRICS_PROJECT_ID}/${METRICS_DATASET}`,
    )
  } catch (error) {
    console.error(
      `Could not write ${document._id}: ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exit(1)
  }
}

if (import.meta.main) {
  await main()
}
