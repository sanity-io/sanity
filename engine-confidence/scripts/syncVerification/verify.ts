// oxlint-disable no-console
import {randomBytes} from 'node:crypto'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import {parseArgs} from 'node:util'

import {readEnv} from '@repo/utils'

import {describeOutcome, unverifiableStepsOf} from './compare'
import {createContentLakeHttp} from './contentLakeHttp'
import {
  type GeneratorReport,
  parseGeneratorReport,
  type ReplayableSequence,
} from './generatorReport'
import {
  type DatasetMode,
  openWorkspace,
  type ReportVerdicts,
  verifyReport,
  workspaceErrorResults,
} from './liveReplay'
import {recordedOutcome, replayOnModel, replayPlan} from './modelReplay'
import {documentIdsOf} from './namespace'
import {type VerdictsFile} from './verdicts'

const USAGE = `Usage: engine-confidence sync-verify <report.json> --out <verdicts.json> [--dry-run]
  [--dataset-mode create|existing] [--dataset <name>] [--project-id <id>] [--api-host <host>]

Environment: SANITY_E2E_SESSION_TOKEN (write token), SANITY_E2E_PROJECT_ID (unless --project-id),
SANITY_CLI_API_RATE_LIMIT_BYPASS (optional).`

function isDatasetMode(mode: string): mode is DatasetMode {
  return mode === 'create' || mode === 'existing'
}

function requestSize(sequence: ReplayableSequence, submission: number): string {
  const {request} = sequence.submissions[submission]
  const count = request.kind === 'actions' ? request.actions.length : request.mutations.length
  const noun = request.kind === 'actions' ? 'action' : 'mutation'
  const endpoint = request.kind === 'actions' ? 'data/actions' : 'data/mutate'
  return `${request.kind} (${count} ${noun}${count === 1 ? '' : 's'}) -> POST ${endpoint}`
}

function sequenceLines(heading: string, sequence: ReplayableSequence): string[] {
  const steps = replayOnModel(sequence, documentIdsOf(sequence))
  const stepLines = steps.map((step) => {
    const recorded = describeOutcome(recordedOutcome(sequence.submissions[step.submission]))
    const agrees = recorded === describeOutcome(step.outcome) ? '' : '  <- differs from record'
    return `    replay #${step.submission} ${requestSize(sequence, step.submission)}; recorded ${recorded}, model ${describeOutcome(step.outcome)}${agrees}`
  })
  const skippedLines = replayPlan(sequence).flatMap((entry) =>
    entry.replay ? [] : [`    skip   #${entry.submission} (${entry.reason})`],
  )
  const unverifiable = unverifiableStepsOf(sequence)
  return [
    heading,
    `    seed ${sequence.initial.length} document(s): ${sequence.initial.map((document) => document._id).join(', ')}`,
    ...stepLines,
    ...skippedLines,
    ...(unverifiable.length > 0 ? [`    not verifiable: ${unverifiable.join(', ')}`] : []),
  ]
}

export function dryRunLines(report: GeneratorReport): string[] {
  const samples = report.samples ?? []
  const header = `Report ${report.commit} (${report.seam} seam): ${report.failures.length} failure(s), ${samples.length} passing sample(s)`
  return [
    header,
    ...report.failures.flatMap((failure, index) =>
      sequenceLines(`[failure ${index}] ${failure.signature}`, failure),
    ),
    ...samples.flatMap((sample, index) =>
      sequenceLines(`[sample ${index}] seed ${sample.seed} run ${sample.runIndex}`, sample),
    ),
  ]
}

function verdictCounts(verdicts: ReadonlyArray<{verdict: string}>): string {
  const counts = verdicts.reduce(
    (tally, {verdict}) => tally.set(verdict, (tally.get(verdict) ?? 0) + 1),
    new Map<string, number>(),
  )
  return [...counts].map(([verdict, count]) => `${count} ${verdict}`).join(', ')
}

async function main(): Promise<void> {
  const {values, positionals} = parseArgs({
    options: {
      'out': {type: 'string'},
      'dry-run': {type: 'boolean', default: false},
      'dataset-mode': {type: 'string', default: 'create'},
      'dataset': {type: 'string'},
      'project-id': {type: 'string'},
      'api-host': {type: 'string', default: 'api.sanity.work'},
    },
    allowPositionals: true,
  })
  const [reportPath] = positionals
  const datasetMode = values['dataset-mode']
  if (reportPath === undefined || !isDatasetMode(datasetMode)) {
    console.error(USAGE)
    process.exit(1)
  }

  let report: GeneratorReport
  try {
    report = parseGeneratorReport(readFileSync(path.resolve(reportPath), 'utf8'))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  if (values['dry-run']) {
    console.log(dryRunLines(report).join('\n'))
    return
  }
  if (values.out === undefined || (datasetMode === 'existing' && values.dataset === undefined)) {
    console.error(USAGE)
    process.exit(1)
  }

  const runId = randomBytes(3).toString('hex')
  const http = createContentLakeHttp({
    projectId: values['project-id'] ?? readEnv('SANITY_E2E_PROJECT_ID'),
    dataset: values.dataset ?? `cursor_ci_sync_${runId}`,
    token: readEnv('SANITY_E2E_SESSION_TOKEN'),
    apiHost: values['api-host'],
    rateLimitBypass: process.env.SANITY_CLI_API_RATE_LIMIT_BYPASS,
    log: console.warn,
  })
  console.log(
    `Run ${runId}: ${report.failures.length} failure(s) and ${report.samples?.length ?? 0} sample(s) against ${http.dataset} (${datasetMode} mode)`,
  )

  const results = await runAgainstWorkspace(report, http, datasetMode, runId)
  const verdictsFile: VerdictsFile = {
    version: 1,
    commit: report.commit,
    seam: report.seam,
    ...results,
  }
  const outPath = path.resolve(values.out)
  mkdirSync(path.dirname(outPath), {recursive: true})
  writeFileSync(outPath, `${JSON.stringify(verdictsFile, null, 2)}\n`)
  console.log(
    `Wrote ${results.verdicts.length} failure verdict(s) to ${outPath}: ${verdictCounts(results.verdicts) || 'none'}`,
  )
  if (results.samples) {
    console.log(
      `Samples: ${results.samples.length} replayed, ${verdictCounts(results.samples) || 'none'}`,
    )
  }
}

async function runAgainstWorkspace(
  report: GeneratorReport,
  http: ReturnType<typeof createContentLakeHttp>,
  mode: DatasetMode,
  runId: string,
): Promise<ReportVerdicts> {
  let workspace: Awaited<ReturnType<typeof openWorkspace>>
  try {
    workspace = await openWorkspace(http, mode)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return workspaceErrorResults(report, error)
  }
  const closeAndExit = async (signal: string) => {
    console.error(`${signal}: cleaning up ${http.dataset} before exiting`)
    await workspace.close()
    process.exit(130)
  }
  process.once('SIGINT', closeAndExit)
  process.once('SIGTERM', closeAndExit)
  try {
    return await verifyReport(report, http, runId, console.log)
  } finally {
    await workspace.close().catch((error: unknown) => {
      console.error(
        `Could not delete ${http.dataset}: ${error instanceof Error ? error.message : String(error)}`,
      )
      process.exitCode = 1
    })
  }
}

if (import.meta.main) {
  await main()
}
