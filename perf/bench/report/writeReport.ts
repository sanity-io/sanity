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
 * CI passes the scenario sets it scheduled (comma-separated env vars, set in
 * bench.yml next to the shard matrix) so a shard that failed and uploaded no
 * result JSON is called out in the report instead of silently missing.
 */
function expectedScenarios(value: string | undefined, kind: ScenarioReport['kind']) {
  return (value ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((scenario): MissingScenario => ({scenario, kind}))
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

  const missingScenarios = [
    ...expectedScenarios(process.env.BENCH_EXPECTED_INTERACTION_SCENARIOS, 'interaction'),
    ...expectedScenarios(process.env.BENCH_EXPECTED_PAGELOAD_SCENARIOS, 'pageload'),
  ].filter(
    (expected) =>
      !merged.scenarios.some(
        (scenario) => scenario.scenario === expected.scenario && scenario.kind === expected.kind,
      ),
  )
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
  fs.writeFileSync(
    path.join(resultsDir, 'report.md'),
    renderMarkdownReport(merged, {missingScenarios}),
  )
  console.log(
    `Merged ${files.length} shard(s) → ${path.join(resultsDir, 'report.md')} (${merged.scenarios.length} scenario report(s))`,
  )
}
