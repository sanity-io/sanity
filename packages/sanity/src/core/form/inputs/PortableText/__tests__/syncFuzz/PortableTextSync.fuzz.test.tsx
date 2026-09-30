/**
 * Fuzz test for keeping the Portable Text editor and the Studio in sync.
 *
 * Each run sends a random list of steps to `PortableTextInput`: local edits,
 * remote edits, commits, listener events and clock ticks. The input runs on
 * the real document store code. After the last step the test lets everything
 * finish, then checks that the editor, the form and the server all have the
 * same value.
 *
 * The test doesn't need to know what the right document is. If the copies
 * disagree at the end, something is wrong.
 *
 * The regular unit test run leaves this file out, because it takes minutes.
 * Run it with its own config (from the repo root):
 *
 *   pnpm --filter sanity test:fuzz
 *
 * Runs use a fixed seed unless you ask for a random one, so every run gives
 * the same result. To run with a random seed:
 *
 *   FUZZ_RANDOM=1 FUZZ_RUNS=500 pnpm --filter sanity test:fuzz
 *
 * Keep it to about 1000 runs per process. For more, start several processes,
 * each with its own seed.
 *
 * When a check fails, fast-check prints the seed, the path and the shortest
 * failing list of steps it found. The test also prints what was logged to
 * `console.error` during that run. To run the list again with the same
 * checks, pass it as JSON in `FUZZ_OPS`. It runs once, in every test that
 * could have produced it. Pass the whole failing value fast-check prints,
 * which is the starting document (`"empty"`, `"one"` or `"two"`) and the
 * steps:
 *
 *   FUZZ_OPS='["empty",[{"type":"local.insertText","text":"a"}]]' pnpm --filter sanity test:fuzz
 *
 * A plain list of steps also works, and starts from the two-block document.
 *
 * Or rerun the exact case with `FUZZ_SEED` and `FUZZ_PATH`. A path only works
 * for the test it came from, so pick that test with `-t`:
 *
 *   FUZZ_SEED=123 FUZZ_PATH="4:1:0" pnpm --filter sanity test:fuzz -t 'same value after any sequence'
 *
 * Not covered: the fake server accepts every commit and never drops the
 * listener connection, so failed or retried commits, rejected revisions and
 * reconnects are not tested. The fake server also applies patches with the
 * same `@sanity/mutator` code as the Studio, so the test checks the order in
 * which edits are applied and rebased, not whether the mutator and the real
 * Content Lake apply a patch the same way.
 */
import {type PortableTextBlock} from '@sanity/types'
import * as fc from 'fast-check'
import {afterAll, afterEach, beforeAll, expect, test} from 'vitest'

import {
  coverage,
  createFuzzTestProvider,
  createHarness,
  FIELD,
  type FuzzTestProvider,
  type Harness,
  normalizeValue as normalize,
} from './harness'
import {
  countCharacters,
  insertOnlyOperationArbitrary,
  isInsertOnlyOperation,
  isLocalOnlyOperation,
  localOnlyOperationArbitrary,
  type Operation,
  operationArbitrary,
  runOperation,
} from './operations'

const INITIAL_BODY: PortableTextBlock[] = [
  {
    _key: 'b1',
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{_key: 's1', _type: 'span', text: 'hello', marks: []}],
  },
  {
    _key: 'b2',
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{_key: 's2', _type: 'span', text: 'world', marks: []}],
  },
]

/**
 * Documents a run can start from. `empty` has no value for the field at all,
 * like a new document. That matters: the form treats "the field is empty" as
 * a special case, and a field that starts empty is where that case goes wrong.
 */
const STARTS = {
  empty: undefined,
  one: INITIAL_BODY.slice(0, 1),
  two: INITIAL_BODY,
} satisfies Record<string, PortableTextBlock[] | undefined>
type Start = keyof typeof STARTS
const anyStart = fc.constantFrom<Start>('empty', 'one', 'two')

/** The seed runs use unless `FUZZ_SEED` or `FUZZ_RANDOM` says otherwise. */
const DEFAULT_SEED = 1

function parseReplay(json: string | undefined): [Start, Operation[]] | undefined {
  if (json === undefined) return undefined
  const parsed = JSON.parse(json) as [Start, Operation[]] | Operation[]
  return typeof parsed[0] === 'string'
    ? (parsed as [Start, Operation[]])
    : ['two', parsed as Operation[]]
}

const replay = parseReplay(process.env.FUZZ_OPS)
const replayOperations = replay?.[1]
function numberFromEnv(name: string): number | undefined {
  const raw = process.env[name]
  if (raw === undefined) return undefined
  const value = Number(raw)
  if (!Number.isFinite(value)) throw new Error(`${name} must be a number, got "${raw}"`)
  return value
}

const numRuns = replay ? 1 : (numberFromEnv('FUZZ_RUNS') ?? 150)
/** A few seconds per run, and at least ten minutes. */
const timeout = Math.max(600_000, numRuns * 3_000)
const seed = numberFromEnv('FUZZ_SEED') ?? (process.env.FUZZ_RANDOM ? undefined : DEFAULT_SEED)
const path = process.env.FUZZ_PATH

let TestProvider: FuzzTestProvider
let harness: Harness | undefined
let runCount = 0

/**
 * Errors PTE logs (and recovers from) when a patch no longer fits its value.
 * They don't fail the test, but they show how often runs hit conflicting
 * edits, so they are counted and printed at the end.
 */
const patchApplyErrors = new Map<string, number>()

/**
 * What the current run logged to `console.error` and `console.warn`, not
 * counting React's `act` warnings (noise from using fake timers). Kept per run and printed only when
 * a check fails, so Vitest doesn't store the output of every run.
 */
let runErrors: string[] = []
let failedRunErrors: string[] = []

const originalConsole = {error: console.error, warn: console.warn}

function formatLogArguments(args: unknown[]): string {
  return args
    .map((arg) => (arg instanceof Error ? (arg.stack ?? arg.message) : String(arg)))
    .join(' ')
}

beforeAll(async () => {
  TestProvider = await createFuzzTestProvider()
  // Plain replacements rather than `vi.spyOn`, whose mocks would keep the
  // arguments of every call from every run.
  console.error = (...args: unknown[]) => {
    const message = formatLogArguments(args)
    const match = /^(?:Error: )?Cannot apply an? "?([^"]+)"? .*because/.exec(message)
    if (match) patchApplyErrors.set(match[1], (patchApplyErrors.get(match[1]) ?? 0) + 1)
    if (!message.includes('not wrapped in act(')) runErrors.push(message)
  }
  console.warn = (...args: unknown[]) => {
    runErrors.push(`warn: ${formatLogArguments(args)}`)
  }
})

afterAll(() => {
  console.error = originalConsole.error
  console.warn = originalConsole.warn
  // oxlint-disable-next-line no-console -- summary of all runs
  console.log('Fuzz coverage:', JSON.stringify(coverage))
  if (patchApplyErrors.size > 0) {
    // oxlint-disable-next-line no-console -- summary of all runs
    console.log('PTE patch apply errors (recovered):', Object.fromEntries(patchApplyErrors))
  }
})

afterEach(() => {
  harness?.unmount()
  harness = undefined
})

function assertHealthy(current: Harness) {
  const forwardingError = current.forwardingError()
  if (forwardingError) {
    throw new Error(
      `The document update stream errored, so the form stops receiving document events. Either a patch from the input could not be applied to the local document, or the input threw while handling an event: ${String(forwardingError)}`,
      {cause: forwardingError},
    )
  }
  if (!current.editorMounted()) {
    // The input shows a message in place of the editor, such as "Non-unique
    // keys" when two blocks share a `_key`.
    throw new Error(
      `The editor unmounted. The input now shows: ${document.body.textContent?.slice(0, 300)}`,
    )
  }
}

function assertConverged(current: Harness) {
  const editorValue = normalize(current.editorValue())
  const formValue = normalize(current.formValue())
  expect(formValue, 'form value diverged from the editor').toEqual(editorValue)
  // Only the editor shows an empty value as a placeholder block, so the form
  // and the server are compared as they are. A missing field and an empty
  // array still count as the same.
  expect(current.server.head[FIELD] ?? [], 'server value diverged from the form').toEqual(
    current.formValue() ?? [],
  )
}

function addCounts(target: Map<string, number>, delta: Map<string, number>, sign: 1 | -1 = 1) {
  for (const [character, count] of delta) {
    target.set(character, (target.get(character) ?? 0) + sign * count)
  }
}

function sortedCounts(counts: Map<string, number>): Record<string, number> {
  return Object.fromEntries(
    [...counts].filter(([, count]) => count !== 0).sort(([a], [b]) => a.localeCompare(b)),
  )
}

function countText(text: string): Map<string, number> {
  return countCharacters([
    {_key: 'text', _type: 'block', children: [{_key: 'span', _type: 'span', text}]},
  ])
}

async function startRun(start: Start): Promise<Harness> {
  harness?.unmount()
  // Cleared first: if the mount below throws, there is no harness to unmount.
  harness = undefined
  runErrors = []
  harness = await createHarness(STARTS[start], TestProvider)
  return harness
}

function endRun() {
  harness?.unmount()
  harness = undefined
  if (process.env.FUZZ_DEBUG_MEMORY && ++runCount % 100 === 0) {
    // oxlint-disable-next-line no-console -- debug aid
    console.log(`run ${runCount}: heap ${Math.round(process.memoryUsage().heapUsed / 1e6)} MB`)
  }
}

/**
 * Runs one check. If it fails, prints what the last failing run logged. After
 * shrinking, that run is the one fast-check reports.
 */
async function checkProperty(
  run: (start: Start, operations: Operation[]) => Promise<void>,
  arbitrary: fc.Arbitrary<Operation>,
  starts: fc.Arbitrary<Start> = anyStart,
) {
  const runs: fc.Arbitrary<[Start, Operation[]]> = replay
    ? fc.constant(replay)
    : fc.tuple(starts, fc.array(arbitrary, {minLength: 1, maxLength: 40}))
  failedRunErrors = []
  try {
    await fc.assert(
      fc.asyncProperty(runs, async ([start, operations]) => {
        try {
          await run(start, operations)
        } catch (error) {
          failedRunErrors = runErrors
          throw error
        }
      }),
      {numRuns, seed, path, verbose: 1},
    )
  } catch (error) {
    if (failedRunErrors.length > 0) {
      originalConsole.error(
        `console.error and console.warn output from the failing run:\n\n${failedRunErrors.join('\n\n')}`,
      )
    }
    throw error
  }
}

test(
  'editor, form and server end up with the same value after any sequence of edits and sync events',
  {timeout},
  async () => {
    await checkProperty(async (start, operations) => {
      const current = await startRun(start)
      for (const operation of operations) {
        await runOperation(current, operation)
        assertHealthy(current)
      }
      await current.settle()
      assertHealthy(current)
      assertConverged(current)
      endRun()
    }, operationArbitrary)
  },
)

// A replayed run only makes sense for the test that could have produced it.
// This test always starts from the two-block document, because the remote
// client owns the second block.
test.skipIf(
  replay !== undefined && (replay[0] !== 'two' || !replay[1].every(isInsertOnlyOperation)),
)(
  'no typed character is lost when nobody deletes anything and edits do not overlap',
  {timeout},
  async () => {
    await checkProperty(
      async (start, operations) => {
        const current = await startRun(start)
        // The starting text, plus everything the local user typed, plus
        // everything the remote client wrote. Counted from the steps, not read
        // back from the editor: a sync bug that removes text from the editor
        // would otherwise lower the expected count along with it.
        const expected = countCharacters(STARTS[start])

        for (const operation of operations) {
          const {localInserted, remoteInserted} = await runOperation(current, operation, {
            partitioned: true,
          })
          assertHealthy(current)
          addCounts(expected, countText(localInserted + remoteInserted))
        }

        await current.settle()
        assertHealthy(current)
        assertConverged(current)
        expect(
          sortedCounts(countCharacters(current.server.head[FIELD] as PortableTextBlock[])),
          'characters were lost or duplicated',
        ).toEqual(sortedCounts(expected))
        endRun()
      },
      insertOnlyOperationArbitrary,
      fc.constant<Start>('two'),
    )
  },
)

test.skipIf(replayOperations !== undefined && !replayOperations.every(isLocalOnlyOperation))(
  'what the user sees in the editor is what gets saved when nobody else edits',
  {timeout},
  async () => {
    await checkProperty(async (start, operations) => {
      const current = await startRun(start)
      for (const operation of operations) {
        await runOperation(current, operation)
        assertHealthy(current)
      }
      // With nobody else editing, the editor's value after the last step is
      // what the user expects to be saved. The other checks can't catch a
      // loss that every copy agrees on, like the form replacing the whole
      // field with an empty value.
      const seen = normalize(current.editorValue())
      await current.settle()
      assertHealthy(current)
      assertConverged(current)
      expect(
        normalize(current.server.head[FIELD] as PortableTextBlock[]),
        'the saved document differs from what the editor showed',
      ).toEqual(seen)
      endRun()
    }, localOnlyOperationArbitrary)
  },
)
