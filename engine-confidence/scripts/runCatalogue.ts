// oxlint-disable no-console
import {spawnSync} from 'node:child_process'
import {existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import {parseArgs} from 'node:util'

import {
  CATALOGUE_SUITE_IDS,
  type CatalogueEntryResult,
  type CatalogueSuiteId,
  type CatalogueSuiteResult,
} from '@repo/utils/engine-confidence'

import {
  type CatalogueEntry,
  filesInPatchFile,
  isActive,
  loadCatalogueEntries,
} from './catalogue/entries'
import {renderMatrix, suiteResultOf, type CatalogueResultsFile} from './catalogue/results'
import {buildSuiteRuns, type SuiteRun, witnessRunFor} from './catalogue/suites'
import {
  failingTestsOf,
  type FailingTest,
  namePatternFor,
  newFailuresOf,
  noReportFailureOf,
  uniqueFilesOf,
  type VitestJsonReport,
  crashedBeforeReport,
} from './catalogue/vitestReport'
import {without} from './collections'
import {computePinnedHash, readPinnedConfig} from './config'
import {dirtyPathsUnder, runGit} from './git'
import {catalogueDirectory, catalogueReportsDirectory, repositoryRoot} from './paths'

const EXIT_PATCH_DOES_NOT_APPLY = 2
const EXIT_DIRTY_TREE = 3
const EXIT_RED_BASELINE = 4
const EXIT_HASH_MISMATCH = 6
const EXIT_INERT_ENTRY = 7

interface RunOutcome {
  label: string
  suite: CatalogueSuiteId
  exitCode: number | null
  durationMs: number
  failing: FailingTest[]
  stderrTail: string
}

function logProgress(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

function exitWith(exitCode: number, messages: string[]): never {
  messages.forEach((message) => console.error(message))
  process.exit(exitCode)
}

const appliedPatches: string[] = []

function applyPatch(patchPath: string): void {
  const result = runGit(['apply', patchPath])
  if (result.status === 0) {
    appliedPatches.push(patchPath)
    return
  }
  throw new Error(`Could not apply ${patchPath}: ${result.stderr.trim()}`)
}

function revertPatch(patchPath: string): void {
  const result = runGit(['apply', '-R', patchPath])
  if (result.status === 0) {
    appliedPatches.splice(appliedPatches.indexOf(patchPath), 1)
    return
  }
  throw new Error(`Could not revert ${patchPath}; the tree is dirty: ${result.stderr.trim()}`)
}

function appliedPatchesNewestFirst(): string[] {
  return [...appliedPatches].reverse()
}

function withPatches<Result>(patchPaths: string[], action: () => Result): Result {
  try {
    patchPaths.forEach(applyPatch)
    return action()
  } finally {
    appliedPatchesNewestFirst().forEach(revertPatch)
  }
}

function revertAppliedPatchesOnSignal(signal: NodeJS.Signals): void {
  console.error(`Received ${signal}; reverting applied patches`)
  appliedPatchesNewestFirst().forEach((patchPath) => runGit(['apply', '-R', patchPath]))
  process.exit(130)
}

function reportIsReadable(reportPath: string): boolean {
  return existsSync(reportPath) && statSync(reportPath).size > 0
}

function executeRun(run: SuiteRun, reportPath: string, extraArguments: string[] = []): RunOutcome {
  rmSync(reportPath, {force: true})
  const startedAt = Date.now()
  const result = spawnSync(
    run.command,
    [
      ...run.baseArguments,
      ...run.targets,
      ...extraArguments,
      '--reporter=json',
      `--outputFile=${reportPath}`,
    ],
    {
      cwd: run.workingDirectory,
      env: {...process.env, ...run.environment},
      encoding: 'utf8',
      maxBuffer: 512 * 1024 * 1024,
    },
  )
  const failing = reportIsReadable(reportPath)
    ? failingTestsOf(
        JSON.parse(readFileSync(reportPath, 'utf8')) as VitestJsonReport,
        repositoryRoot,
      )
    : [noReportFailureOf(run.label)]
  return {
    label: run.label,
    suite: run.suite,
    exitCode: result.status,
    durationMs: Date.now() - startedAt,
    failing,
    stderrTail: (result.stderr ?? '').split('\n').slice(-20).join('\n'),
  }
}

function reportPathFor(phase: string, label: string): string {
  return path.join(
    catalogueReportsDirectory,
    'reports',
    `${phase}--${label.replaceAll(/[^\w.-]/g, '_')}.json`,
  )
}

function runSuites(runs: SuiteRun[], phase: string): RunOutcome[] {
  return runs.map((run) => {
    logProgress(`${phase}: ${run.label}`)
    return executeRun(run, reportPathFor(phase, run.label))
  })
}

function rerunOnCleanTree(run: SuiteRun, newFailures: FailingTest[]): FailingTest[] {
  if (crashedBeforeReport(newFailures)) {
    return executeRun(run, reportPathFor('flake-check', run.label)).failing
  }
  const pattern = namePatternFor(newFailures)
  const files = uniqueFilesOf(newFailures).map((file) => path.join(repositoryRoot, file))
  const rerun = executeRun(
    {...run, targets: files},
    reportPathFor('flake-check', run.label),
    pattern === undefined ? [] : ['-t', pattern],
  )
  return rerun.failing
}

interface EntryEvaluation {
  results: CatalogueSuiteResult[]
  inert: boolean
}

function witnessIsInert(entry: CatalogueEntry, witnessRun: SuiteRun): boolean {
  if (entry.witnessPatchPath === undefined) return false
  logProgress(`${entry.metadata.id}: inert check`)
  const outcome = withPatches([entry.patchPath, entry.witnessPatchPath], () =>
    executeRun(witnessRun, reportPathFor(entry.metadata.id, 'witness')),
  )
  return outcome.exitCode === 0
}

function evaluateEntry(options: {
  entry: CatalogueEntry
  suiteRuns: Map<CatalogueSuiteId, SuiteRun[]>
  baseline: RunOutcome[]
  witnessRun: SuiteRun | undefined
}): EntryEvaluation {
  const {entry, suiteRuns, baseline, witnessRun} = options
  const {id, notApplicableSuites} = entry.metadata
  const inert = witnessRun === undefined ? false : witnessIsInert(entry, witnessRun)
  const runnableSuites = without([...suiteRuns.keys()], notApplicableSuites)

  const patchedOutcomes = withPatches([entry.patchPath], () =>
    runnableSuites.map((suite) => ({
      suite,
      outcomes: (suiteRuns.get(suite) ?? []).map((run) => {
        logProgress(`${id}: ${run.label}`)
        return {run, outcome: executeRun(run, reportPathFor(id, run.label))}
      }),
    })),
  )

  const evaluated = new Map(
    patchedOutcomes.map(({suite, outcomes}) => {
      const confirmed = outcomes.flatMap(({run, outcome}) => {
        const baselineFailing =
          baseline.find((candidate) => candidate.label === run.label)?.failing ?? []
        const newFailures = newFailuresOf(outcome.failing, baselineFailing)
        if (newFailures.length === 0) return []
        const failingOnCleanTree = new Set(
          rerunOnCleanTree(run, newFailures).map((failure) => failure.id),
        )
        const flaky = newFailures.filter((failure) => failingOnCleanTree.has(failure.id))
        if (flaky.length > 0) {
          logProgress(`${id}: dropped ${flaky.length} flaky failure(s) in ${run.label}`)
        }
        return without(newFailures, flaky, (failure) => failure.id)
      })
      const durationMs = outcomes.reduce((total, {outcome}) => total + outcome.durationMs, 0)
      const failingTests = [...new Set(confirmed.map((failure) => failure.id))]
      return [
        suite,
        suiteResultOf(suite, {
          status: failingTests.length > 0 ? 'caught' : 'missed',
          durationMs,
          ...(failingTests.length > 0 ? {failingTests} : {}),
        }),
      ] as const
    }),
  )

  const results = CATALOGUE_SUITE_IDS.map((suite) => {
    const evaluatedResult = evaluated.get(suite)
    if (evaluatedResult !== undefined) return evaluatedResult
    return suiteResultOf(suite, {
      status: notApplicableSuites.includes(suite) ? 'not-applicable' : 'not-run',
    })
  })
  return {results, inert}
}

function logExpectationMismatch(entry: CatalogueEntry, results: CatalogueSuiteResult[]): void {
  const ranSuites = results
    .filter((result) => result.status === 'caught' || result.status === 'missed')
    .map((result) => result.suite)
  const caught = results
    .filter((result) => result.status === 'caught')
    .map((result) => result.suite)
  const expected = entry.metadata.expectedCaughtBy.filter((suite) => ranSuites.includes(suite))
  const differs = expected.length !== caught.length || without(expected, caught).length > 0
  if (differs) {
    logProgress(
      `${entry.metadata.id}: expected caught by [${expected.join(', ')}] but got [${caught.join(', ')}]`,
    )
  }
}

function parseSuites(raw: string | undefined): CatalogueSuiteId[] {
  const requested = raw === undefined ? [...CATALOGUE_SUITE_IDS] : raw.split(',').filter(Boolean)
  const unknown = without<string>(requested, CATALOGUE_SUITE_IDS)
  if (unknown.length > 0) {
    exitWith(1, [
      `Unknown suite(s): ${unknown.join(', ')}. Known: ${CATALOGUE_SUITE_IDS.join(', ')}`,
    ])
  }
  return requested as CatalogueSuiteId[]
}

function allPatchPaths(entries: CatalogueEntry[]): string[] {
  return entries.flatMap((entry) => [
    entry.patchPath,
    ...(entry.witnessPatchPath === undefined ? [] : [entry.witnessPatchPath]),
  ])
}

function checkPatchesApply(entries: CatalogueEntry[]): void {
  const stale = allPatchPaths(entries)
    .map((patchPath) => ({patchPath, check: runGit(['apply', '--check', patchPath])}))
    .filter(({check}) => check.status !== 0)
  if (stale.length > 0) {
    exitWith(EXIT_PATCH_DOES_NOT_APPLY, [
      'Stale catalogue patches (they no longer apply; see the README refresh section):',
      ...stale.map(
        ({patchPath, check}) =>
          `  ${path.relative(repositoryRoot, patchPath)}: ${check.stderr.trim()}`,
      ),
    ])
  }
}

function exitOnRedBaseline(baseline: RunOutcome[]): void {
  const redBaseline = baseline.filter(
    (outcome) => outcome.exitCode !== 0 || outcome.failing.length > 0,
  )
  if (redBaseline.length > 0) {
    exitWith(EXIT_RED_BASELINE, [
      'A suite is red on the clean tree; a catch would be meaningless:',
      ...redBaseline.map(
        (outcome) =>
          `  ${outcome.label}: exit ${outcome.exitCode}, ${outcome.failing.length} failing test(s)\n${outcome.failing
            .slice(0, 10)
            .map((failure) => `    ${failure.id}`)
            .join('\n')}\n${outcome.stderrTail}`,
      ),
    ])
  }
}

function main(): void {
  const {values} = parseArgs({
    options: {
      'suites': {type: 'string'},
      'only': {type: 'string'},
      'check-only': {type: 'boolean', default: false},
    },
  })
  const selectedSuites = parseSuites(values.suites)
  const onlyIds = values.only?.split(',').filter(Boolean)
  const config = readPinnedConfig()
  if (computePinnedHash() !== config.pinnedHash) {
    exitWith(EXIT_HASH_MISMATCH, [
      'The pinned config changed without a version bump. Run `pnpm engine-confidence pin`.',
    ])
  }

  const entries = loadCatalogueEntries(catalogueDirectory)
    .filter(isActive)
    .filter((entry) => onlyIds === undefined || onlyIds.includes(entry.metadata.id))
  checkPatchesApply(entries)
  if (values['check-only']) {
    logProgress(`${allPatchPaths(entries).length} catalogue patches apply cleanly`)
    return
  }

  const touchedFiles = entries.flatMap((entry) => [
    ...filesInPatchFile(entry.patchPath),
    ...(entry.witnessPatchPath === undefined ? [] : filesInPatchFile(entry.witnessPatchPath)),
  ])
  const dirtyTouched = dirtyPathsUnder(touchedFiles)
  if (dirtyTouched.length > 0) {
    exitWith(EXIT_DIRTY_TREE, [
      'Files touched by the catalogue have local changes; refusing to run.',
      ...dirtyTouched.map((line) => `  ${line}`),
    ])
  }
  const treeBefore = dirtyPathsUnder(['packages'])

  process.on('SIGINT', revertAppliedPatchesOnSignal)
  process.on('SIGTERM', revertAppliedPatchesOnSignal)
  mkdirSync(path.join(catalogueReportsDirectory, 'reports'), {recursive: true})
  const startedAt = new Date().toISOString()

  const suiteRuns = new Map(
    selectedSuites
      .map((suite) => [suite, buildSuiteRuns(config, suite, repositoryRoot)] as const)
      .filter(([, runs]) => runs.length > 0),
  )
  const baseline = [...suiteRuns.values()].flatMap((runs) => runSuites(runs, 'baseline'))
  writeFileSync(
    path.join(catalogueReportsDirectory, 'baseline.json'),
    `${JSON.stringify(baseline, null, 2)}\n`,
  )
  exitOnRedBaseline(baseline)

  const entryResults: CatalogueEntryResult[] = []
  const inertEntries: string[] = []
  entries.forEach((entry, index) => {
    const witnessFile = entry.witnessPatchPath
      ? filesInPatchFile(entry.witnessPatchPath)[0]
      : undefined
    const {results, inert} = evaluateEntry({
      entry,
      suiteRuns,
      baseline,
      witnessRun:
        witnessFile === undefined ? undefined : witnessRunFor(config, repositoryRoot, witnessFile),
    })
    logExpectationMismatch(entry, results)
    if (inert) inertEntries.push(entry.metadata.id)
    const {metadata} = entry
    const entryResult: CatalogueEntryResult = {
      _key: `entry-${index}`,
      id: metadata.id,
      title: metadata.title,
      severity: metadata.severity,
      failureClass: metadata.failureClass,
      ...(metadata.sourceUrl === undefined ? {} : {sourceUrl: metadata.sourceUrl}),
      addedOn: metadata.addedOn,
      results,
    }
    entryResults.push(entryResult)
    writeFileSync(
      path.join(catalogueReportsDirectory, `${metadata.id}.json`),
      `${JSON.stringify(entryResult, null, 2)}\n`,
    )
  })

  const resultsFile: CatalogueResultsFile = {
    repoHead: runGit(['rev-parse', 'HEAD']).stdout.trim(),
    startedAt,
    completedAt: new Date().toISOString(),
    fuzzSeeds: config.catalogue.suites['fuzz:pt'].seeds,
    fuzzRuns: config.catalogue.suites['fuzz:pt'].runs,
    suitesRun: [...suiteRuns.keys()],
    entries: entryResults,
    inertEntries,
    suiteTimings: [...suiteRuns.keys()].map((suite) => ({
      suite,
      baselineDurationMs: baseline
        .filter((outcome) => outcome.suite === suite)
        .reduce((total, outcome) => total + outcome.durationMs, 0),
    })),
  }
  writeFileSync(
    path.join(catalogueReportsDirectory, 'results.json'),
    `${JSON.stringify(resultsFile, null, 2)}\n`,
  )
  writeFileSync(
    path.join(catalogueReportsDirectory, 'matrix.md'),
    `${renderMatrix(entryResults)}\n`,
  )
  logProgress(`\n${renderMatrix(entryResults)}`)

  const treeAfter = dirtyPathsUnder(['packages'])
  if (treeAfter.join('\n') !== treeBefore.join('\n')) {
    exitWith(EXIT_DIRTY_TREE, [
      'The tree under packages/ differs from before the run:',
      ...treeAfter.map((line) => `  ${line}`),
    ])
  }
  if (inertEntries.length > 0) {
    exitWith(EXIT_INERT_ENTRY, [
      `Witness passes with the patch applied (inert entry): ${inertEntries.join(', ')}`,
    ])
  }
}

main()
