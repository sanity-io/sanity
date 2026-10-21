// oxlint-disable no-console
import {appendFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {parseArgs} from 'node:util'

import {
  addMutantCounts,
  coveredMutationScoreOf,
  detectedMutants,
  emptyMutantCounts,
  ENGINE_CONFIDENCE_RUN_TYPE,
  ENGINE_CONFIDENCE_SCHEMA_VERSION,
  type EngineConfidenceRunDocument,
  type EngineConfidenceScore,
  isEntryCaught,
  isoWeekOf,
  type KnownBugsSummary,
  missedMutants,
  mutationScoreOf,
  STRYKER_TARGET_IDS,
  type StrykerTargetId,
  STUDIO_ENGINE_TARGET,
  type StudioEngineScore,
  targetScoreOf,
} from '@repo/utils/engine-confidence'
import {engineConfidenceRunId, gitCommitId} from '@repo/utils/radar-ids'

import {type CatalogueResultsFile} from './catalogue/results'
import {without} from './collections'
import {
  computePinnedHash,
  type PinnedConfig,
  readJsonFile,
  readPinnedConfig,
  readTier1Config,
} from './config'
import {
  type ExclusionEntry,
  ExclusionRegisterError,
  matchExclusions,
  readExclusions,
} from './exclusions'
import {runGit} from './git'
import {
  catalogueReportsDirectory,
  defaultRunDocumentPath,
  engineConfidenceDirectory,
  strykerReportsDirectory,
} from './paths'
import {runDocumentProblems} from './runDocument'
import {mergeStrykerReports} from './stryker/mergeReports'
import {readStrykerReport, type StrykerReport, type StrykerRunMeta} from './stryker/report'

export interface StrykerTargetInput {
  target: StrykerTargetId
  packageDir: string
  report: StrykerReport
  meta: StrykerRunMeta
}

export interface ScoreInputs {
  strykerTargets: StrykerTargetInput[]
  catalogue: CatalogueResultsFile | undefined
  exclusions: ExclusionEntry[]
  pinnedConfig: PinnedConfig
  configHash: string
  strykerVersion: string
  vitestVersion: string
  startedAt: Date
  completedAt: Date
  trigger: EngineConfidenceRunDocument['trigger']
  git: EngineConfidenceRunDocument['git']
  runner: EngineConfidenceRunDocument['runner']
}

const EXIT_HASH_MISMATCH = 6
const EXIT_EXCLUSION_REGISTER = 8

function strykerScore(
  strykerTargets: StrykerTargetInput[],
  exclusions: ExclusionEntry[],
): EngineConfidenceScore {
  if (strykerTargets.length === 0) {
    return {status: 'not-measured', reason: 'No Stryker reports were found'}
  }
  const missing = without(
    STRYKER_TARGET_IDS,
    strykerTargets.map((input) => input.target),
  )
  if (missing.length > 0) {
    return {status: 'not-measured', reason: `No Stryker report for target: ${missing.join(', ')}`}
  }
  const {excludedMutantIds, problems} = matchExclusions(strykerTargets, exclusions)
  if (problems.length > 0) throw new ExclusionRegisterError(problems)
  const files = mergeStrykerReports(strykerTargets, excludedMutantIds)
  const counts = files.reduce(
    (total, file) => addMutantCounts(total, file.counts),
    emptyMutantCounts(),
  )
  const ratio = mutationScoreOf(counts)
  if (ratio === undefined) {
    return {status: 'not-measured', reason: 'Stryker reported no scored mutants'}
  }
  const coveredRatio = coveredMutationScoreOf(counts)
  return {
    status: 'measured',
    ratio,
    ...(coveredRatio === undefined ? {} : {coveredRatio}),
    counts,
    targets: strykerTargets.map((input, index) => ({
      _key: `target-${index}`,
      target: input.target,
      mode: input.meta.mode,
      reusedMutants: input.meta.reusedMutants,
      dryRunTests: input.meta.dryRunTests,
      durationMs: input.meta.durationMs,
    })),
    files,
  }
}

function studioEngineScore(score: EngineConfidenceScore): StudioEngineScore {
  return score.status === 'measured'
    ? targetScoreOf(score.files, STUDIO_ENGINE_TARGET)
    : {status: 'not-measured', reason: score.reason}
}

function knownBugsSummary(catalogue: CatalogueResultsFile | undefined): KnownBugsSummary {
  if (catalogue === undefined) {
    return {status: 'not-measured', reason: 'No catalogue results were found'}
  }
  if (catalogue.entries.length === 0) {
    return {status: 'not-measured', reason: 'The catalogue has no active entries'}
  }
  return {
    status: 'measured',
    activeEntries: catalogue.entries.length,
    caughtEntries: catalogue.entries.filter(isEntryCaught).length,
    entries: catalogue.entries,
  }
}

export function buildRunDocument(inputs: ScoreInputs): EngineConfidenceRunDocument {
  const {pinnedConfig, startedAt} = inputs
  const score = strykerScore(inputs.strykerTargets, inputs.exclusions)
  const studioScore = studioEngineScore(score)
  const knownBugs = knownBugsSummary(inputs.catalogue)
  const isoWeek = isoWeekOf(startedAt)
  const fuzzSuite = pinnedConfig.catalogue.suites['fuzz:pt']
  return {
    _id: engineConfidenceRunId(isoWeek),
    _type: ENGINE_CONFIDENCE_RUN_TYPE,
    schemaVersion: ENGINE_CONFIDENCE_SCHEMA_VERSION,
    isoWeek,
    trigger: inputs.trigger,
    startedAt: startedAt.toISOString(),
    completedAt: inputs.completedAt.toISOString(),
    git: inputs.git,
    runner: inputs.runner,
    config: {
      version: pinnedConfig.version,
      hash: inputs.configHash,
      strykerVersion: inputs.strykerVersion,
      vitestVersion: inputs.vitestVersion,
      timeoutMs: pinnedConfig.stryker.timeoutMs,
      concurrency: pinnedConfig.stryker.concurrency,
      fuzzSeeds: fuzzSuite.seeds,
      fuzzRuns: fuzzSuite.runs,
    },
    score,
    studioScore,
    knownBugs,
  }
}

function readPackageVersion(packageName: string): string {
  const manifestPath = path.join(
    engineConfidenceDirectory,
    'node_modules',
    packageName,
    'package.json',
  )
  return readJsonFile<{version: string}>(manifestPath).version
}

function triggerFromEnvironment(trigger: string | undefined): ScoreInputs['trigger'] {
  if (trigger === 'schedule' || trigger === 'dispatch' || trigger === 'local') return trigger
  const eventName = process.env.GITHUB_EVENT_NAME
  if (eventName === 'schedule') return 'schedule'
  return eventName === 'workflow_dispatch' ? 'dispatch' : 'local'
}

function gitInfo(): EngineConfidenceRunDocument['git'] {
  const sha = process.env.GITHUB_SHA ?? runGit(['rev-parse', 'HEAD']).stdout.trim()
  const branch =
    process.env.GITHUB_REF_NAME ?? runGit(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim()
  const committedAt = runGit(['log', '-1', '--format=%cI']).stdout.trim()
  const isFullSha = /^[0-9a-f]{40}$/.test(sha)
  return {
    sha,
    branch,
    ...(committedAt.length > 0 ? {committedAt} : {}),
    ...(isFullSha ? {commit: {_type: 'reference', _ref: gitCommitId(sha), _weak: true}} : {}),
  }
}

function runnerInfo(): EngineConfidenceRunDocument['runner'] {
  const cpuModel = os.cpus()[0]?.model.trim()
  return {
    os: process.platform,
    arch: process.arch,
    cpus: os.cpus().length,
    memGb: Math.round(os.totalmem() / 1024 ** 3),
    nodeVersion: process.version,
    ...(cpuModel ? {cpuModel} : {}),
    ...(process.env.ImageOS ? {imageOs: process.env.ImageOS} : {}),
    ...(process.env.ImageVersion ? {imageVersion: process.env.ImageVersion} : {}),
    ci: process.env.CI === 'true',
    ...(process.env.GITHUB_RUN_ID ? {runId: process.env.GITHUB_RUN_ID} : {}),
    ...(process.env.GITHUB_RUN_ATTEMPT ? {runAttempt: Number(process.env.GITHUB_RUN_ATTEMPT)} : {}),
  }
}

function readStrykerTargetInput(options: {
  strykerDirectory: string
  target: StrykerTargetId
  packageDir: string
  configVersion: number
  configHash: string
}): StrykerTargetInput | undefined {
  const {strykerDirectory, target, packageDir, configVersion, configHash} = options
  const reportPath = path.join(strykerDirectory, `${target}.json`)
  const metaPath = path.join(strykerDirectory, `${target}.run.json`)
  if (existsSync(reportPath) && existsSync(metaPath)) {
    const meta = readJsonFile<StrykerRunMeta>(metaPath)
    if (meta.configVersion === configVersion && meta.configHash === configHash) {
      return {target, packageDir, report: readStrykerReport(reportPath), meta}
    }
    throw new Error(
      `The ${target} Stryker report was produced with a different pinned config (version ${meta.configVersion}); re-run it`,
    )
  }
  return undefined
}

export function readStrykerInputs(
  strykerDirectory: string,
  configVersion: number,
  configHash: string,
): StrykerTargetInput[] {
  const tier1 = readTier1Config()
  return STRYKER_TARGET_IDS.flatMap((target) => {
    const input = readStrykerTargetInput({
      strykerDirectory,
      target,
      packageDir: tier1[target].packageDir,
      configVersion,
      configHash,
    })
    return input === undefined ? [] : [input]
  })
}

function percentOf(ratio: number | undefined): string {
  return ratio === undefined ? 'not measured' : `${(ratio * 100).toFixed(1)}%`
}

function scoreDetail(score: EngineConfidenceScore | StudioEngineScore): string {
  return score.status === 'measured'
    ? `${percentOf(score.ratio)} (${detectedMutants(score.counts)} detected, ${missedMutants(score.counts)} missed, ${score.counts.ignored} ignored by rule, ${score.counts.excluded} excluded after review)`
    : score.reason
}

export function renderSummary(document: EngineConfidenceRunDocument): string {
  const {score, studioScore, knownBugs} = document
  return [
    `### Engine confidence ${document.isoWeek}`,
    '',
    `Total engine: **${percentOf(score.status === 'measured' ? score.ratio : undefined)}** · Core Studio engine: **${percentOf(studioScore.status === 'measured' ? studioScore.ratio : undefined)}** (config v${document.config.version})`,
    '',
    '| Measure | Result |',
    '| --- | --- |',
    `| Total engine score (Studio + @sanity/mutator) | ${scoreDetail(score)} |`,
    `| Core Studio engine score | ${scoreDetail(studioScore)} |`,
    `| Known bugs caught (not part of the score) | ${knownBugs.status === 'measured' ? `${knownBugs.caughtEntries}/${knownBugs.activeEntries}` : knownBugs.reason} |`,
    '',
  ].join('\n')
}

function main(): void {
  const {values} = parseArgs({
    options: {
      'stryker-dir': {type: 'string'},
      'catalogue': {type: 'string'},
      'started-at': {type: 'string'},
      'trigger': {type: 'string'},
      'out': {type: 'string'},
    },
  })
  const pinnedConfig = readPinnedConfig()
  const configHash = computePinnedHash()
  if (configHash !== pinnedConfig.pinnedHash) {
    console.error(
      'The pinned config changed without a version bump. Run `pnpm engine-confidence pin`.',
    )
    process.exit(EXIT_HASH_MISMATCH)
  }

  const cataloguePath = path.resolve(
    values.catalogue ?? path.join(catalogueReportsDirectory, 'results.json'),
  )
  const startedAt = values['started-at'] ? new Date(values['started-at']) : new Date()
  if (Number.isNaN(startedAt.getTime())) {
    console.error(`--started-at must be an ISO timestamp, got "${values['started-at']}"`)
    process.exit(1)
  }

  let document: EngineConfidenceRunDocument
  try {
    document = buildRunDocument({
      strykerTargets: readStrykerInputs(
        path.resolve(values['stryker-dir'] ?? strykerReportsDirectory),
        pinnedConfig.version,
        configHash,
      ),
      catalogue: existsSync(cataloguePath)
        ? readJsonFile<CatalogueResultsFile>(cataloguePath)
        : undefined,
      exclusions: readExclusions(),
      pinnedConfig,
      configHash,
      strykerVersion: readPackageVersion('@stryker-mutator/core'),
      vitestVersion: readPackageVersion('vitest'),
      startedAt,
      completedAt: new Date(),
      trigger: triggerFromEnvironment(values.trigger),
      git: gitInfo(),
      runner: runnerInfo(),
    })
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(error instanceof ExclusionRegisterError ? EXIT_EXCLUSION_REGISTER : 1)
  }

  const problems = runDocumentProblems(document)
  if (problems.length > 0) {
    problems.forEach((problem) => console.error(problem))
    process.exit(1)
  }

  const outputPath = path.resolve(values.out ?? defaultRunDocumentPath)
  mkdirSync(path.dirname(outputPath), {recursive: true})
  writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`)
  console.log(`Wrote ${outputPath}`)
  console.log(renderSummary(document))
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, renderSummary(document))
  }
}

if (import.meta.main) {
  main()
}
