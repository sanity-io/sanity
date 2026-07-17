// oxlint-disable no-console
/**
 * `bench report` — merge per-shard result JSON files (CI artifacts,
 * `bench-results__*.json`) into one BenchRunDocument, and render the PR
 * comment markdown next to them.
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

import {type MissingScenario, renderMarkdownReport} from './markdown'
import {mergeShards} from './mergeShards'
import {type BenchRunDocument, type ScenarioReport} from './types'

/**
 * Reduce an A/B run to an absolute-mode document holding only the experiment
 * side: drop the reference side and the comparison verdict from every metric,
 * and flip `mode`. The result is comparable to the main-branch absolute series
 * and safe to store under the PR branch.
 */
export function toAbsolute(run: BenchRunDocument): BenchRunDocument {
  return {
    ...run,
    mode: 'absolute',
    scenarios: run.scenarios.map((scenario) => ({
      ...scenario,
      metrics: scenario.metrics.map((metric) => {
        const {reference, comparison, ...rest} = metric
        return rest
      }),
      // Reference-side interruptions/resources drop with the reference side
      interruptions: {experiment: scenario.interruptions.experiment},
      ...(scenario.resources ? {resources: {experiment: scenario.resources.experiment}} : {}),
    })),
    // A/B bundle carries both sides; keep only experiment
    ...(run.bundle ? {bundle: {experiment: run.bundle.experiment}} : {}),
  }
}

interface ExpectedEntry {
  missing: MissingScenario
  /**
   * The value a real report's `mode ?? kind` resolves to (mirrors the
   * mergeShards dedup key). INP reports share `kind: 'pageload'` with plain
   * pageload reports, so `kind` alone can't tell an expected INP scenario
   * apart from an expected pageload one — this can.
   */
  reportKind: string
}

/**
 * CI passes the scenario sets it scheduled (comma-separated env vars, set in
 * bench.yml next to the shard matrix) so a shard that failed and uploaded no
 * result JSON is called out in the report instead of silently missing.
 */
function expectedEntries(
  value: string | undefined,
  kind: ScenarioReport['kind'],
  reportKind: string = kind,
): ExpectedEntry[] {
  return (value ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((scenario) => ({missing: {scenario, kind}, reportKind}))
}

function isReported(scenarios: ScenarioReport[], entry: ExpectedEntry): boolean {
  return scenarios.some(
    (scenario) =>
      scenario.scenario === entry.missing.scenario &&
      (scenario.mode ?? scenario.kind) === entry.reportKind,
  )
}

export function computeMissingScenarios(
  scenarios: ScenarioReport[],
  expected: {interaction?: string; pageload?: string; inp?: string},
): MissingScenario[] {
  return [
    ...expectedEntries(expected.interaction, 'interaction'),
    ...expectedEntries(expected.pageload, 'pageload'),
    ...expectedEntries(expected.inp, 'pageload', 'inp'),
  ]
    .filter((entry) => !isReported(scenarios, entry))
    .map((entry) => entry.missing)
}

export function writeMergedReport(resultsDirArg?: string): void {
  const resultsDir =
    resultsDirArg ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'results')

  const files = fs.existsSync(resultsDir)
    ? fs.readdirSync(resultsDir).filter((file) => /^bench-results__.*\.json$/.test(file))
    : []

  if (files.length === 0) {
    console.error(`No bench-results__*.json files in ${resultsDir}`)
    process.exit(1)
  }

  const shards = files.map(
    (file) => JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8')) as BenchRunDocument,
  )
  const merged = mergeShards(shards)

  const missingScenarios = computeMissingScenarios(merged.scenarios, {
    interaction: process.env.BENCH_EXPECTED_INTERACTION_SCENARIOS,
    pageload: process.env.BENCH_EXPECTED_PAGELOAD_SCENARIOS,
    inp: process.env.BENCH_EXPECTED_INP_SCENARIOS,
  })
  // Marker for CI: a shard that dies without results (a job timeout
  // surfaces as "cancelled", which never turns the run red) must still fail
  // the check — but only AFTER the comment is posted, so the report job
  // writes this file and a later workflow step exits on it
  const missingMarker = path.join(resultsDir, 'missing-scenarios.json')
  if (missingScenarios.length > 0) {
    console.warn(
      `Missing results for ${missingScenarios.map((item) => `${item.scenario} (${item.kind})`).join(', ')} — shard(s) failed or were skipped`,
    )
    fs.writeFileSync(missingMarker, JSON.stringify(missingScenarios, null, 2))
  } else {
    fs.rmSync(missingMarker, {force: true})
  }

  fs.writeFileSync(path.join(resultsDir, 'merged.json'), JSON.stringify(merged, null, 2))

  // Always emit an absolute-mode variant for storage: the trends dashboard
  // series is absolute, so a labeled PR is stored as its own (experiment-side)
  // absolute numbers under the PR branch — comparable to main and across PRs.
  // toAbsolute is a no-op on an already-absolute run (nothing to strip), which
  // is exactly what a reference-skipped PR produces — without this the store
  // step would find no artifact and never store the PR series. The store step
  // picks this file up.
  fs.writeFileSync(
    path.join(resultsDir, 'merged-absolute.json'),
    JSON.stringify(toAbsolute(merged), null, 2),
  )

  fs.writeFileSync(
    path.join(resultsDir, 'report.md'),
    renderMarkdownReport(merged, {missingScenarios}),
  )
  console.log(
    `Merged ${files.length} shard(s) → ${path.join(resultsDir, 'report.md')} (${merged.scenarios.length} scenario report(s))`,
  )
}
