// oxlint-disable no-console
import {mkdirSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import {parseArgs} from 'node:util'

import {reportsDirectory} from './paths'
import {
  createClaudeExplainer,
  DEFAULT_CLAUDE_MODEL,
  type Explainer,
  placeholderExplainer,
} from './syncVerification/explain'
import {fileFailures, summaryMarkdown} from './syncVerification/fileFailures'
import {createLinearIssues} from './syncVerification/linear'
import {readPairs} from './syncVerification/readPairs'

const USAGE =
  'Usage: engine-confidence sync-file <report.json> <verdicts.json> [<report.json> <verdicts.json>...] [--dry-run] [--summary-dir <dir>]'

function exitWith(message: string): never {
  console.error(message)
  process.exit(1)
}

function createExplainer(): Explainer {
  const apiKey = process.env.SYNC_VERIFICATION_CLAUDE_API_KEY ?? ''
  if (apiKey === '') return placeholderExplainer()
  return createClaudeExplainer({
    apiKey,
    model: process.env.SYNC_VERIFICATION_CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL,
  })
}

async function main(): Promise<void> {
  const {values, positionals} = parseArgs({
    options: {
      'dry-run': {type: 'boolean', default: false},
      'summary-dir': {type: 'string', default: path.join(reportsDirectory, 'sync-verification')},
    },
    allowPositionals: true,
  })
  if (positionals.length === 0 || positionals.length % 2 === 1) exitWith(USAGE)

  const {pairs, errors: unreadable} = readPairs(positionals)

  const mode = values['dry-run'] ? 'dry-run' : 'file'
  const linearApiKey = process.env.LINEAR_API_KEY ?? ''
  const missingKeys = ['LINEAR_API_KEY', 'SYNC_VERIFICATION_CLAUDE_API_KEY'].filter(
    (name) => (process.env[name] ?? '') === '',
  )
  if (mode === 'file' && missingKeys.length > 0) {
    exitWith(`Filing needs ${missingKeys.join(' and ')}; pass --dry-run to only print the issues`)
  }

  const filed = await fileFailures(pairs, {
    dryRun: mode === 'dry-run',
    linear: linearApiKey === '' ? undefined : createLinearIssues(linearApiKey),
    explain: createExplainer(),
  })
  const summary = {...filed, outcomes: [...filed.outcomes, ...unreadable]}
  const markdown = summaryMarkdown(summary)
  const summaryDirectory = path.resolve(values['summary-dir'])
  mkdirSync(summaryDirectory, {recursive: true})
  writeFileSync(
    path.join(summaryDirectory, 'sync-file-summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
  )
  writeFileSync(path.join(summaryDirectory, 'sync-file-summary.md'), `${markdown}\n`)
  console.log(markdown)

  const errorCount = summary.outcomes.filter((outcome) => outcome.action === 'error').length
  if (errorCount > 0) {
    console.error(`${errorCount} failure${errorCount === 1 ? '' : 's'} could not be filed`)
    process.exit(1)
  }
}

if (import.meta.main) {
  await main()
}
