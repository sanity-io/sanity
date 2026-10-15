// oxlint-disable no-console
/**
 * Compute the SQRL score from the stored main-branch benchRun and gitTag
 * documents and upsert one `sqrlScore` document per commit. Run by
 * .github/workflows/bench.yml after `bench store`.
 *
 *   pnpm --filter radar sqrl -- --dry-run              # latest commit, print only
 *   pnpm --filter radar sqrl -- --backfill --dry-run   # every commit, print only
 *   pnpm --filter radar sqrl                           # upsert the latest commit
 *   pnpm --filter radar sqrl -- --backfill             # upsert every commit
 *
 * Every mode computes the whole series, since the 7-commit median and the
 * chain-linked index need all of history; the default writes only the newest
 * commit's document so earlier documents stay as they were published.
 * Backfill rewrites them all — the step after a backfill run or a formula
 * change (which also bumps FORMULA_VERSION).
 *
 * Writes need RADAR_SANITY_WRITE_TOKEN (CI only). A dry run reads with
 * SANITY_AUTH_TOKEN, falling back to the `sanity login` token.
 */
import {existsSync, readFileSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import {parseArgs} from 'node:util'

import {readEnv} from '@repo/utils'
import {createClient} from '@sanity/client'

import {type SqrlRun} from '../sqrl/inputs'
import {SQRL_RUNS_PARAMS, SQRL_RUNS_QUERY, SQRL_TAGS_QUERY} from '../sqrl/queries'
import {type SqrlTag} from '../sqrl/reliability'
import {computeSqrlScores, type SqrlScoreDocument} from '../sqrl/score'

const METRICS_PROJECT_ID = 'mhfozd0z'
const METRICS_DATASET = 'bench'

/** sqrlScore documents are ~10 KB each; 50 keeps a backfill transaction well under the request limit. */
const MUTATIONS_PER_TRANSACTION = 50

function cliLoginToken(): string | undefined {
  const configPath = path.join(os.homedir(), '.config', 'sanity', 'config.json')
  const config: unknown = existsSync(configPath)
    ? JSON.parse(readFileSync(configPath, 'utf8'))
    : undefined
  return typeof config === 'object' &&
    config !== null &&
    'authToken' in config &&
    typeof config.authToken === 'string'
    ? config.authToken
    : undefined
}

function readToken(dryRun: boolean): string {
  if (dryRun) {
    const token =
      process.env.SANITY_AUTH_TOKEN || process.env.RADAR_SANITY_WRITE_TOKEN || cliLoginToken()
    if (token) return token
    throw new Error(
      'A dry run reads the private dataset: set SANITY_AUTH_TOKEN or run `sanity login`',
    )
  }
  return readEnv('RADAR_SANITY_WRITE_TOKEN')
}

function formatNumber(value: number | null, digits = 2): string {
  return value === null ? 'n/a' : value.toFixed(digits)
}

function printSummary(document: SqrlScoreDocument): void {
  console.log(
    `SQRL ${formatNumber(document.score, 1)} at ${document.git.sha.slice(0, 10)} (${document.git.committedAt}); ` +
      `this commit ${formatNumber(document.scoreCommit, 1)}, raw ${formatNumber(document.scoreRaw, 1)}; ` +
      `host ${formatNumber(document.host.calibrationMs)} ms ${document.host.cpuModel ?? ''}; ` +
      `${document.benchRunIds.length} run(s)`,
  )
  console.table(
    document.pillars.map((pillar) => ({
      pillar: pillar.label,
      weight: formatNumber(pillar.weight, 3),
      score: formatNumber(pillar.score, 1),
    })),
  )
  console.table(
    document.inputs.map((input) => ({
      input: input.key,
      weight: formatNumber(input.weight, 4),
      value: formatNumber(input.value, 3),
      reference: formatNumber(input.referenceValue, 3),
      ratio: formatNumber(input.ratio, 3),
      points: formatNumber(input.contributionPoints, 2),
      trend: input.trend,
    })),
  )
  console.log(
    `Reliability: ${document.reliability.count} event(s) in the trailing ${document.reliability.windowWeeks} weeks ` +
      `(reference ${document.reliability.referenceCount}): ` +
      document.reliability.events
        .map((event) => `${event.kind} ${event.tag} ${event.day}`)
        .join(', '),
  )
}

async function main(): Promise<void> {
  const {values} = parseArgs({
    // pnpm forwards `--` verbatim, and parseArgs would demote everything after it to positionals
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {
      'backfill': {type: 'boolean', default: false},
      'dry-run': {type: 'boolean', default: false},
    },
  })
  const dryRun = values['dry-run']

  const client = createClient({
    projectId: METRICS_PROJECT_ID,
    dataset: METRICS_DATASET,
    apiVersion: '2025-02-19',
    token: readToken(dryRun),
    useCdn: false,
    perspective: 'raw',
  })

  const [runs, tags] = await Promise.all([
    client.fetch<SqrlRun[]>(SQRL_RUNS_QUERY, SQRL_RUNS_PARAMS),
    client.fetch<SqrlTag[]>(SQRL_TAGS_QUERY),
  ])
  const scores = computeSqrlScores(runs, tags)
  const latest = scores.at(-1)
  if (latest === undefined) throw new Error('No main-branch benchRun documents to score')
  const documents = values.backfill ? scores : [latest]
  console.log(
    `Computed ${scores.length} commit(s) from ${runs.length} run(s) and ${tags.length} tag(s); ` +
      `${values.backfill ? 'backfill' : 'latest'} mode, ${documents.length} document(s) to upsert`,
  )
  printSummary(latest)

  if (dryRun) {
    if (values.backfill) {
      console.table(
        scores.map((score) => ({
          committedAt: score.git.committedAt,
          sha: score.git.sha.slice(0, 10),
          score: formatNumber(score.score, 1),
          commit: formatNumber(score.scoreCommit, 1),
          raw: formatNumber(score.scoreRaw, 1),
        })),
      )
    }
    console.log('Dry run — nothing written')
    return
  }

  for (let offset = 0; offset < documents.length; offset += MUTATIONS_PER_TRANSACTION) {
    const batch = documents.slice(offset, offset + MUTATIONS_PER_TRANSACTION)
    // oxlint-disable-next-line no-await-in-loop -- one transaction at a time keeps the request rate low and a failure leaves a clean prefix
    await batch
      .reduce(
        (transaction, document) => transaction.createOrReplace(document),
        client.transaction(),
      )
      .commit()
    console.log(`Upserted ${Math.min(offset + batch.length, documents.length)}/${documents.length}`)
  }
}

await main()
