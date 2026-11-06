import {execFileSync} from 'node:child_process'
import {writeFileSync} from 'node:fs'
import {resolve} from 'node:path'

import * as fc from 'fast-check'
import {afterEach, describe, expect, test} from 'vitest'

import {
  caseArbitrary,
  checkCase,
  expectGeneratedKeys,
  type GeneratedCase,
  GeneratedRunError,
  type PassingRun,
  printDefinition,
  requestShapeOf,
  type RunFailure,
  type SubmissionReport,
} from '../../../../../test/sync/generator'
import {runSyncTest, type SyncTestDefinition, type World} from '../../../../../test/sync/syncTest'

type Seam = SyncTestDefinition['seam']

interface ReportedFailure extends RunFailure {
  seed: number
  initial: SyncTestDefinition['initial']
}

interface GeneratorSample {
  seed: number
  runIndex: number
  definition: SyncTestDefinition
  initial: SyncTestDefinition['initial']
  submissions: SubmissionReport[]
}

interface GeneratorReport {
  version: 1
  commit: string
  seam: Seam
  seeds: number[]
  runsPerSeed: number
  maxSteps: number
  failures: ReportedFailure[]
  samples?: GeneratorSample[]
}

interface Sampling {
  seed: number
  runIndex: number
  nextAt: number
  taken: number
}

interface Search {
  ignored: Set<string>
  failures: ReportedFailure[]
  samples: GeneratorSample[]
  sampleShapes: Set<string>
  sampling?: Sampling
  seedsRun: number[]
  skippedSeeds: number[]
  problems: string[]
  operationsWorlds: number
}

// Each operations-seam world adds about 0.5 MB to memoized store caches that are never evicted, so one process runs out of memory after roughly 7,000.
const OPERATIONS_WORLD_BUDGET = 5_000
const MAX_FAILURES_PER_SEED = 10
const BASE_TIMEOUT_MS = 10_000
const SEQUENCE_TIMEOUT_MS = 20
const DEFAULT_MAX_STEPS = 8

function isSet(raw: string | undefined): raw is string {
  return raw !== undefined && raw !== ''
}

function parseInteger(name: string, raw: string): number {
  const value = Number(raw.trim())
  if (Number.isSafeInteger(value)) return value
  throw new Error(`${name} must be an integer, got "${raw}"`)
}

function integerFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  return isSet(raw) ? parseInteger(name, raw) : fallback
}

function rangeOf(first: number, last: number): number[] {
  if (last < first) throw new Error(`SYNC_GEN_SEEDS range ${first}-${last} is empty`)
  return [...Array(last - first + 1).keys()].map((offset) => first + offset)
}

function parseSeeds(raw: string): number[] {
  const range = raw.trim().match(/^(\d+)-(\d+)$/)
  if (range)
    return rangeOf(
      parseInteger('SYNC_GEN_SEEDS', range[1]),
      parseInteger('SYNC_GEN_SEEDS', range[2]),
    )
  return raw.split(',').map((seed) => parseInteger('SYNC_GEN_SEEDS', seed))
}

function seedsFromEnv(): number[] {
  const {SYNC_GEN_SEED: single, SYNC_GEN_SEEDS: list} = process.env
  if (isSet(single) && isSet(list)) throw new Error('Set SYNC_GEN_SEED or SYNC_GEN_SEEDS, not both')
  return isSet(list) ? parseSeeds(list) : [integerFromEnv('SYNC_GEN_SEED', 1)]
}

function seamFromEnv(): Seam {
  const raw = process.env.SYNC_GEN_SEAM
  if (raw === undefined || raw === '' || raw === 'pair') return 'pair'
  if (raw === 'operations') return raw
  throw new Error(`SYNC_GEN_SEAM must be pair or operations, got "${raw}"`)
}

function ignoredFromEnv(): string[] {
  return (process.env.SYNC_GEN_IGNORE ?? '')
    .split(';')
    .map((signature) => signature.trim())
    .filter(isSet)
}

const seeds = seedsFromEnv()
const runs = integerFromEnv('SYNC_GEN_RUNS', 100)
const maxSteps = integerFromEnv('SYNC_GEN_MAX_STEPS', DEFAULT_MAX_STEPS)
const seam = seamFromEnv()
const collect = process.env.SYNC_GEN_COLLECT === '1'
const reportPath = process.env.SYNC_GEN_REPORT
const sampleSize = integerFromEnv('SYNC_GEN_SAMPLE', 0)
const sampleSpacing = sampleSize > 0 ? Math.max(1, Math.floor(runs / sampleSize)) : runs

if (seam === 'operations' && runs > OPERATIONS_WORLD_BUDGET) {
  throw new Error(
    `SYNC_GEN_RUNS=${runs} exceeds the operations seam budget of ${OPERATIONS_WORLD_BUDGET} sequences per process; split the run across seeds and processes`,
  )
}

function timeoutMs(): number {
  const perSequence = SEQUENCE_TIMEOUT_MS * Math.max(1, maxSteps / DEFAULT_MAX_STEPS)
  const rounds = collect ? MAX_FAILURES_PER_SEED + 1 : 1
  return BASE_TIMEOUT_MS + Math.ceil(seeds.length * runs * rounds * perSequence)
}

async function countedCheck(
  search: Search,
  generatedCase: GeneratedCase,
  keep = false,
): Promise<PassingRun | undefined> {
  if (seam === 'operations') search.operationsWorlds += 1
  return checkCase(generatedCase, seam, keep)
}

// Samples spread over a seed's runs, and a run that sends the same requests as an earlier sample makes way for the next one.
function wantsSample(sampling: Sampling | undefined): sampling is Sampling {
  return (
    sampling !== undefined &&
    sampling.taken < sampleSize &&
    sampling.runIndex >= sampling.nextAt &&
    sampling.runIndex < runs
  )
}

function offerSample(search: Search, sampling: Sampling, run: PassingRun): void {
  const shape = requestShapeOf(run.submissions)
  if (run.submissions.length === 0 || search.sampleShapes.has(shape)) return
  search.sampleShapes.add(shape)
  const definition = {
    ...run.definition,
    id: `GEN-SAMPLE-${sampling.seed}-${sampling.runIndex}`,
    title: `Passing run ${sampling.runIndex} of SYNC_GEN_SEED=${sampling.seed}`,
  }
  search.samples.push({
    seed: sampling.seed,
    runIndex: sampling.runIndex,
    definition,
    initial: definition.initial,
    submissions: run.submissions,
  })
  sampling.taken += 1
  sampling.nextAt = sampling.runIndex + sampleSpacing
}

async function checkUnlessIgnored(search: Search, generatedCase: GeneratedCase): Promise<void> {
  const {sampling} = search
  const sampled = wantsSample(sampling)
  try {
    const run = await countedCheck(search, generatedCase, sampled)
    if (sampled && run) offerSample(search, sampling, run)
  } catch (error) {
    if (error instanceof GeneratedRunError && search.ignored.has(error.failure.signature)) return
    throw error
  }
}

async function replay(
  search: Search,
  generatedCase: GeneratedCase,
): Promise<RunFailure | undefined> {
  try {
    await countedCheck(search, generatedCase)
  } catch (error) {
    if (error instanceof GeneratedRunError) return error.failure
    throw error
  }
  return undefined
}

function overBudget(search: Search): boolean {
  return seam === 'operations' && search.operationsWorlds + runs > OPERATIONS_WORLD_BUDGET
}

function report(failure: RunFailure, seed: number, index: number): ReportedFailure {
  const definition = {
    ...failure.definition,
    id: `GEN-${seed}-${index}`,
    title: `Generated with SYNC_GEN_SEED=${seed}`,
  }
  return {...failure, seed, definition, initial: definition.initial}
}

type CheckResult = Awaited<ReturnType<typeof fc.check<[GeneratedCase]>>>

async function recordCounterexample(
  seed: number,
  search: Search,
  round: number,
  result: CheckResult,
): Promise<void> {
  if (result.counterexample === null) {
    search.problems.push(
      `Seed ${seed} failed without a counterexample: ${String(result.errorInstance)}`,
    )
    return
  }
  const failure = await replay(search, result.counterexample[0])
  if (failure === undefined || search.ignored.has(failure.signature)) {
    search.problems.push(
      `Seed ${seed}: the shrunk sequence did not fail the same way when replayed (${failure?.signature ?? 'passed'}), so the failure is not deterministic`,
    )
    return
  }
  search.ignored.add(failure.signature)
  search.failures.push(report(failure, seed, round + 1))
  if (collect) await searchSeed(seed, search, round + 1)
}

function advanceSampling(search: Search): void {
  if (search.sampling) search.sampling.runIndex += 1
}

// After a failure fast-check calls the property for shrink candidates, which are not runs of the seed.
async function sampledCheck(search: Search, generatedCase: GeneratedCase): Promise<void> {
  try {
    await checkUnlessIgnored(search, generatedCase)
  } catch (error) {
    search.sampling = undefined
    throw error
  } finally {
    advanceSampling(search)
  }
}

async function searchSeed(seed: number, search: Search, round: number): Promise<void> {
  if (round === MAX_FAILURES_PER_SEED) return
  if (round > 0 && overBudget(search)) {
    search.problems.push(
      `Seed ${seed} was not searched past its first ${round} failures: the operations seam budget of ${OPERATIONS_WORLD_BUDGET} sequences per process is spent.`,
    )
    return
  }
  search.sampling =
    round === 0 && sampleSize > 0 ? {seed, runIndex: 0, nextAt: 0, taken: 0} : undefined
  const result = await fc.check(
    fc.asyncProperty(caseArbitrary(maxSteps, seam), (generatedCase) =>
      sampledCheck(search, generatedCase),
    ),
    {seed, numRuns: runs},
  )
  search.sampling = undefined
  if (result.failed) await recordCounterexample(seed, search, round, result)
}

async function searchSeeds(remaining: number[], search: Search): Promise<void> {
  const [seed, ...rest] = remaining
  if (seed === undefined) return
  if (overBudget(search)) {
    search.skippedSeeds.push(...remaining)
    return
  }
  search.seedsRun.push(seed)
  await searchSeed(seed, search, 0)
  if (collect || search.failures.length === 0) await searchSeeds(rest, search)
}

function commitSha(): string {
  const fromEnv = process.env.SYNC_GEN_COMMIT
  if (isSet(fromEnv)) return fromEnv
  return execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim()
}

function writeReport(path: string, search: Search): void {
  const generatorReport: GeneratorReport = {
    version: 1,
    commit: commitSha(),
    seam,
    seeds: search.seedsRun,
    runsPerSeed: runs,
    maxSteps,
    failures: search.failures,
    ...(sampleSize > 0 ? {samples: search.samples} : {}),
  }
  writeFileSync(resolve(path), `${JSON.stringify(generatorReport, null, 2)}\n`)
}

function describeFailure(failure: ReportedFailure): string {
  const definition = printDefinition(
    failure.definition,
    failure.definition.id,
    failure.definition.title,
  )
  const replayNote =
    seam === 'operations'
      ? `\n\nReplay it with runSyncTest(syncTest, {schema: articleSchema, typeName: 'article'}), importing articleSchema from test/sync/generator.`
      : ''
  return `Rule broken: ${failure.signature}\n\n${failure.message}\n\n${definition}${replayNote}`
}

function summary(search: Search): string {
  const skipped =
    search.skippedSeeds.length === 0
      ? []
      : [
          `Seeds ${search.skippedSeeds.join(',')} were not run: the operations seam budget of ${OPERATIONS_WORLD_BUDGET} sequences per process is spent. Run them in another process.`,
        ]
  return [...search.failures.map(describeFailure), ...search.problems, ...skipped].join(
    '\n\n---\n\n',
  )
}

describe(`generated step sequences against the ${seam} seam`, () => {
  test(
    'two clients converge, stay healthy, keep every array key and lose no edit after any valid sequence',
    {timeout: timeoutMs()},
    async () => {
      const search: Search = {
        ignored: new Set(ignoredFromEnv()),
        failures: [],
        samples: [],
        sampleShapes: new Set(),
        seedsRun: [],
        skippedSeeds: [],
        problems: [],
        operationsWorlds: 0,
      }
      await searchSeeds(seeds, search)
      if (isSet(reportPath)) writeReport(reportPath, search)
      const clean = [search.failures, search.problems, search.skippedSeeds].every(
        (list) => list.length === 0,
      )
      if (clean) return
      expect.fail(summary(search))
    },
  )
})

describe('the generated array-key check', () => {
  const draftId = 'drafts.article-gen'
  const draft = {
    _id: draftId,
    _type: 'article',
    _rev: 'seed',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    items: [
      {_key: 'a', _type: 'item', title: 'A'},
      {_key: 'b', _type: 'item', title: 'B'},
    ],
  }
  const insert = (key: string) => [
    {setIfMissing: {items: []}},
    {insert: {after: 'items[-1]', items: [{_key: key, _type: 'item', title: key}]}},
  ]
  function rejectedSaveAfter(steps: SyncTestDefinition['steps']): SyncTestDefinition {
    return {
      id: 'GEN-KEYS',
      title: 'A saves, then holds a save and the server answers 409',
      seam: 'pair',
      initial: [draft],
      idPair: {publishedId: 'article-gen', draftId},
      clients: ['A'],
      steps: [
        ...steps,
        {client: 'A', do: 'commits', mode: 'hold'},
        {client: 'A', do: 'patch', id: draftId, patches: [{set: {title: 'one'}}]},
        {client: 'A', do: 'commit'},
        {client: 'A', do: 'rejectCommit', statusCode: 409},
        {do: 'settle'},
      ],
    }
  }

  let world: World | undefined
  afterEach(() => {
    world?.teardown()
    world = undefined
  })

  test('GEN-KEYS-ACCEPTED-BEFORE-REJECTION: a key accepted before an injected 409 on the same client stays checked', async () => {
    world = await runSyncTest(
      rejectedSaveAfter([
        {client: 'A', do: 'patch', id: draftId, patches: insert('k1')},
        {client: 'A', do: 'commit'},
        {do: 'advance', ms: 10},
      ]),
    )
    const history = {
      world,
      initialKeys: ['a', 'b'],
      touches: [{key: 'k1', type: 'insert' as const, edit: world.edits[0]}],
    }
    expectGeneratedKeys(history)

    world.lake.mutateFromOutside([{patch: {id: draftId, unset: ['items[_key=="k1"]']}}])

    expect(() => expectGeneratedKeys(history)).toThrow()
  })

  test('GEN-KEYS-DISCARDED-BY-REJECTION: a key whose insert an injected 409 discarded may be missing', async () => {
    world = await runSyncTest(
      rejectedSaveAfter([{client: 'A', do: 'patch', id: draftId, patches: insert('k1')}]),
    )

    expect(world.lake.get(draftId)?.items).toHaveLength(2)
    expectGeneratedKeys({
      world,
      initialKeys: ['a', 'b'],
      touches: [{key: 'k1', type: 'insert', edit: world.edits[0]}],
    })
  })
})
